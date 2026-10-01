![Main branch (selected)](https://img.shields.io/badge/NEX_App_(4.0)-white.svg?style=for-the-badge)
[![Legacy branch](https://img.shields.io/badge/NEX_App_(Legacy/3.0)-%2300000000.svg?style=for-the-badge)](https://github.com/nerotvlive/nex-app/tree/legacy)
[![Zyneon Application repository](https://img.shields.io/badge/Zyneon_Application_(Old/1.0)-%2300000000.svg?style=for-the-badge)](https://github.com/nerotvlive/zyneon-application)

- - -

# NEX App

by **Zyneon Apex**, a **Zyneon Studios** division

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/nerotvlive/nex-app/blob/master/LICENSE.md)
[![Latest stable version](https://img.shields.io/badge/Stable_Version-3.0.36-blue.svg)](https://github.com/nerotvlive/nex-app/releases/tag/v3.0.35)
[![Latest alpha version](https://img.shields.io/badge/Unstable_Version-4.0.0_Alpha-red.svg)](https://github.com/nerotvlive/nex-app/releases/tag/v4.0.0)

- - -

![Logo](https://i.ibb.co/rGqGjPMw/nexapp.png)

The NEX App is a modern and cross-platform Minecraft: Java Edition modding utility, manager, installer, and launcher.
It integrates CurseForge, Modrinth and our own self-hostable content distribution system Zyndex.
<br><br>

[![Download Stable](https://img.shields.io/badge/Download_Stable-blue.svg?style=for-the-badge)](https://github.com/nerotvlive/nex-app/releases/tag/v3.0.35)
[![Download Prerelease](https://img.shields.io/badge/Download_4.0.0_Alpha-red.svg?style=for-the-badge)](https://github.com/nerotvlive/nex-app/releases/tag/v4.0.0)

- - -

> [!IMPORTANT]
> **We're searching for help**<br>
> Currently, the NEX App effectively has only two developers who are working on it as a hobby and is entirely self-taught, so we are looking for support.<br>
> GitHub contributions, issue reports and feedback is highly welcome.<br>
> If you are interested in joining the team, please get in touch via [our Discord server](https://discord.gg/g3ZwWugj9N) or message @nerotvlive directly.

This README is work in progress...

- - -

### Dependencies

##### JAR File (only way to run the app for macOS)
- Java 25, we recommend [Azul Zulu JDK](https://www.azul.com/downloads/?version=java-25-lts&package=jdk#zulu)
- The native webview runtimes for your operating system if you are on Windows 10 and Linux. On Windows 11 and macOS they should be pre-installed.

#### Windows 10+:
- [Microsoft Edge WebView2](https://developer.microsoft.com/microsoft-edge/webview2)
  - Should be pre-installed on Windows 11 systems but if it is not, you can download it from the official Microsoft website linked above.
- If you want to launch the .jar you have to install Java 25, we recommend [Azul Zulu JDK](https://www.azul.com/downloads/?version=java-25-lts&os=windows&package=jdk#zulu).

#### Linux:
##### Debian based (Ubuntu & Co):
```bash
sudo apt-get install libgtk-4-1 libwebkit2gtk-4.1-0 libwebkitgtk-6.0-4 libjavascriptcoregtk-6.0-1 openjdk-25-jdk -y
```

##### Other distros:
You need webkit/webkitgtk support and a Java 25 jdk. We're working on more distro based dependency commands. A Flatpak with inbuilt dependencies is in the works.

- - -

###### The Zyneon NEX App is an independent project and not affiliated with Minecraft, Mojang AB, Mojang Studios, XBOX, XBOX Game Studios, Microsoft, Rinth Inc., Spark Universe, Modrinth, Overwolf or CurseForge.
