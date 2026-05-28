Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = scriptDir & "\nodejs\node.exe"
serverDir = scriptDir & "\server"
port = "3001"

If Not fso.FileExists(nodeExe) Then
    On Error Resume Next
    Set test = WshShell.Exec("node --version")
    If Err.Number <> 0 Then
        WshShell.Popup "未检测到 Node.js！" & Chr(13) & Chr(13) & "请确认 nodejs\node.exe 存在，或安装 Node.js 到系统。", 0, "DolphinScheduler Monitor", 16
        WScript.Quit 1
    End If
    On Error GoTo 0
    nodeExe = "node"
End If

Set http = CreateObject("MSXML2.XMLHTTP")
On Error Resume Next
http.Open "GET", "http://localhost:" & port & "/api/health", False
http.Send
If Err.Number = 0 And http.Status = 200 Then
    On Error GoTo 0
    isOurService = False
    Set wmi = GetObject("winmgmts:\\.\root\cimv2")
    Set processes = wmi.ExecQuery("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name='node.exe'")
    For Each proc In processes
        If InStr(proc.CommandLine, "dist\index.js") > 0 Then
            isOurService = True
            Exit For
        End If
    Next
    If isOurService Then
        appUrl = "http://localhost:" & port
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
        WScript.Quit 0
    End If
Else
    On Error GoTo 0
End If

result = WshShell.Popup("端口 " & port & " 已被其他程序占用。" & Chr(13) & Chr(13) & "点击"确定"停止占用进程并启动本服务" & Chr(13) & "点击"取消"使用端口 3002 启动", 0, "DolphinScheduler Monitor - 端口冲突", 1 + 48)

If result = 1 Then
    Set wmi = GetObject("winmgmts:\\.\root\cimv2")
    Set netConns = wmi.ExecQuery("SELECT OwningProcess FROM Win32_TcpIpConnection WHERE LocalPort=" & port)
    For Each conn In netConns
        Set killProc = GetObject("winmgmts:\\.\root\cimv2:Win32_Process.ProcessId='" & conn.OwningProcess & "'")
        On Error Resume Next
        killProc.Terminate
        On Error GoTo 0
    Next
    WScript.Sleep 1000
Else
    port = "3002"
End If

If nodeExe = "node" Then
    launchCmd = "cmd /c set PORT=" & port & " && cd /d """ & serverDir & """ && node dist\index.js"
Else
    launchCmd = "cmd /c set PORT=" & port & " && cd /d """ & serverDir & """ && """ & nodeExe & """ dist\index.js"
End If

WshShell.Run launchCmd, 0, False

ready = False
For i = 1 To 30
    WScript.Sleep 1000
    On Error Resume Next
    http.Open "GET", "http://localhost:" & port & "/api/health", False
    http.Send
    If Err.Number = 0 And http.Status = 200 Then
        ready = True
        Exit For
    End If
    On Error GoTo 0
Next

If ready Then
    appUrl = "http://localhost:" & port

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
    WshShell.Popup "服务启动超时，请检查配置。", 0, "DolphinScheduler Monitor", 48
End If
