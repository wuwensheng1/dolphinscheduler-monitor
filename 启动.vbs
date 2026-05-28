Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = scriptDir & "\nodejs\node.exe"
serverDir = scriptDir & "\server"

If Not fso.FileExists(nodeExe) Then
    On Error Resume Next
    Set test = WshShell.Exec("node --version")
    If Err.Number <> 0 Then
        WshShell.Popup "Node.js runtime not found!" & Chr(13) & Chr(13) & "Please ensure nodejs\node.exe exists, or install Node.js.", 0, "DolphinScheduler Monitor", 16
        WScript.Quit 1
    End If
    On Error GoTo 0
    nodeExe = "node"
End If

If nodeExe = "node" Then
    launchCmd = "cmd /c cd /d """ & serverDir & """ && node dist\index.js"
Else
    launchCmd = "cmd /c cd /d """ & serverDir & """ && """ & nodeExe & """ dist\index.js"
End If

WshShell.Run launchCmd, 0, False

Set http = CreateObject("MSXML2.XMLHTTP")
ready = False
For i = 1 To 30
    WScript.Sleep 1000
    On Error Resume Next
    http.Open "GET", "http://localhost:3001/api/health", False
    http.Send
    If Err.Number = 0 And http.Status = 200 Then
        ready = True
        Exit For
    End If
    On Error GoTo 0
Next

If ready Then
    appUrl = "http://localhost:3001"

    edgePath = ""
    On Error Resume Next
    edgePath = WshShell.RegRead("HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe\")
    On Error GoTo 0
    If edgePath = "" Then
        On Error Resume Next
        edgePath = WshShell.RegRead("HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe\")
        On Error GoTo 0
    End If
    If edgePath = "" Then
        If fso.FileExists("C:\Program Files\Microsoft\Edge\Application\msedge.exe") Then
            edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
        ElseIf fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
            edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        End If
    End If

    chromePath = ""
    On Error Resume Next
    chromePath = WshShell.RegRead("HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe\")
    On Error GoTo 0
    If chromePath = "" Then
        On Error Resume Next
        chromePath = WshShell.RegRead("HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe\")
        On Error GoTo 0
    End If

    If edgePath <> "" And fso.FileExists(edgePath) Then
        cmd = """" & edgePath & """ --app=" & appUrl & " --start-maximized"
        WshShell.Run cmd, 1, False
    ElseIf chromePath <> "" And fso.FileExists(chromePath) Then
        cmd = """" & chromePath & """ --app=" & appUrl & " --start-maximized"
        WshShell.Run cmd, 1, False
    Else
        WshShell.Run appUrl, 1, False
    End If
Else
    WshShell.Popup "Service startup timeout, please check configuration.", 0, "DolphinScheduler Monitor", 48
End If
