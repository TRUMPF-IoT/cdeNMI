// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    declare let Debug;
    export function StartupNMI() {
        if (cde.MyBaseAssets.MyServiceHostInfo.DebugLevel > 3)
            debugger;

        if (document.getElementById("cdeLogView")) {
            cde.MyEventLogger.RegisterEvent("CDE_NEW_LOGENTRY", (pSender, location: string, Logtext: string) => {
                const ele = document.getElementById("cdeLogView");
                if (ele)
                    ele.innerHTML = cdeNMI.FormatDateNow("YYYY-MM-DD HH:mm:ss") + ": " + location + ":" + Logtext + "</br>" + ele.innerHTML;
            });
        }
        if (cde.MyBaseAssets.MyServiceHostInfo.ShowLogInConsole === true) {
            cde.MyEventLogger.RegisterEvent("CDE_NEW_LOGENTRY", (pSender, location: string, Logtext: string) => {
                const pText: string = cdeNMI.FormatDateNow("YYYY-MM-DD HH:mm:ss") + ": " + location + ":" + Logtext;
                if (typeof Debug !== "undefined")
                    Debug.writeln(pText);
                else
                    console.log(pText);
            });
        }
        //cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "ScreenInfo", window.innerWidth + "," + window.innerHeight +" Doc:"+ screen.width+","+screen.height);

        document.onkeydown = (evt) => {
            const keyCode = evt ? (evt.which ? evt.which : evt.keyCode) : evt.keyCode;
            if (keyCode === 13) {
                if (cdeNMI.Key13Event !== null)
                    cdeNMI.Key13Event(evt);
                cdeNMI.Key13Event = null;
            } else if (keyCode === 27) {
                //For escape.
                if (cdeNMI.Key27Event !== null)
                    cdeNMI.Key27Event(evt);
                cdeNMI.Key27Event = null;
            }
        };

        //Step 1: Register all overrides (can be done in StartEngine of custom Engines)
        if (cde.MyBaseAssets.MyServiceHostInfo.ShowClassic)
            cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.ScreenManager, "cdeNMI.TheScreenManagerClassic");
        else {
            if (cde.MyBaseAssets.MyServiceHostInfo.ScreenManagerClass) {
                cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.ScreenManager, cde.MyBaseAssets.MyServiceHostInfo.ScreenManagerClass);
            } else {
                cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.ScreenManager, "cdeNMI.TheScreenManagerModern");
            }
        }

        cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.ProgressBar, "cdeNMI.ctrlProgressBarCool");
        cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.SingleCheck, "cdeNMI.ctrlToggleButton2");
        //cde.MyBaseAssets.MyServiceHostInfo.DisableWebWorker = true;
        //cde.MyBaseAssets.MyServiceHostInfo.PortalReset = function () { return; };
        //debugger;
        //Step 2: Create Communication Channel
        if ((<any>window).SharedWorker && !cde.MyBaseAssets.MyServiceHostInfo.DisableWebWorker)
            cde.MyCommChannel = new cdeWEB.cdeWebWorkerComm();
        else
            cde.MyCommChannel = new cdeWEB.cdeWebComm();

        //Step 3: Start Engine Host (starts the ContentService Engine)
        cde.StartEngineHost();

        //Step 4: Start NMI Communication Engine -not required if only manual screens have to be debugged
        //cdeNMI.TheNMIServiceLocal.StartEngine();    //This Engine does not need the CommChannel
        cdeNMI.TheNMIService.StartEngine();

        //Step 5: Login/start communication - Login should be done via NMI!
        if (cde.MyBaseAssets.MyServiceHostInfo.AutoConnectRelay && cde.MyCommChannel) {
            const tConfig: cde.TheCommConfig = new cde.TheCommConfig(cde.MyBaseAssets.MyServiceHostInfo.WsTimeOut);
            tConfig.DisableRSA = cde.CBool(cde.MyBaseAssets.MyServiceHostInfo.DisableRSA);
            if (cde.MyBaseAssets.MyServiceHostInfo.AutoConnectRelay === "INCDE") {
                tConfig.RequestPath = "<%=ISBPATH%>";
                if (tConfig.RequestPath.substr(0, 3) === "<%=")
                    tConfig.RequestPath = null;
                tConfig.uri = cde.MyBaseAssets.MyCommStatus.MyServiceUrl;
                tConfig.wsuri = cde.MyBaseAssets.MyServiceHostInfo.MyWSServiceUrl;
                if (cde.MyBaseAssets.MyServiceHostInfo.UToken) {
                    tConfig.Creds = new cde.TheCDECredentials();
                    tConfig.Creds.QToken = cde.MyBaseAssets.MyServiceHostInfo.UToken;
                }
                tConfig.NoISB = true;
            }
            else {
                tConfig.uri = cde.MyBaseAssets.MyServiceHostInfo.AutoConnectRelay;
            }
            cde.MyCommChannel.RegisterEvent("CDE_CONN_CHANGED", (sender, bSuccess: boolean) => {
                if (bSuccess)
                    cdeNMI.CreatePortalControls();
                else {
                    cdeNMI.ShowMessage("Connection Failed", "A connection could not be established. Please verify your settings.")
                }
            });
            cde.MyCommChannel.RegisterEvent("CDE_SESSION_ENDED", (sender, pReason: string) => {
                if (cde.MyBaseAssets.MyServiceHostInfo.PortalReset)
                    cde.MyBaseAssets.MyServiceHostInfo.PortalReset();
                else {
                    cde.MyBaseAssets.MyServiceHostInfo.LoginDisallowed = true;
                    if (cde.MyBaseAssets.MyCommStatus) {
                        cde.MyBaseAssets.MyCommStatus.UserPref = null;
                        cde.MyBaseAssets.MyCommStatus.IsConnected = false;
                    }
                    if (cde.MyCommChannel) {
                        cde.MyCommChannel.ForceDisconnect = true;
                    }
                    cdeNMI.RemoveCookies();
                    const tLogView = document.getElementById("cdeLogView") as HTMLDivElement;
                    document.body.innerHTML = "";
                    if (tLogView)
                        document.body.appendChild(tLogView);
                    //var t = cde.TheBaseAssets.IsConnectionDown();
                    cdeNMI.ShowMessage(pReason, "Please refresh this page to login again")
                }
            });
            cde.MyCommChannel.RegisterEvent("CDE_NO_CONNECT", (sender, pReason: string) => {
                cdeNMI.ShowMessage("Connection Failed", pReason);
            });
            cde.MyCommChannel.StartCommunication(tConfig); //This is async now...we need connection update messages to show
        }
        else
            cdeNMI.CreatePortalControls();
    }

    export function ShowMessage(pStatus: string, pReason: string) {
        cde.MyBaseAssets.MyServiceHostInfo.LoginDisallowed = true;
        cdeNMI.MyLoginScreen = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.LoginScreen, true) as cdeNMI.INMILoginScreen;
        if (cdeNMI.MyLoginScreen) {
            cdeNMI.MyLoginScreen.SetProperty("StatusText", pStatus);
            cdeNMI.MyLoginScreen.SetProperty("ReasonText", pReason);
            cdeNMI.MyLoginScreen.Create(null);
        }
    }

    export function CreatePortalControls() {
        //Step 6: Create other Portal Controls
        cdeNMI.MyToast = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.Toast, true).Create(null) as cdeNMI.INMIToast;
        cdeNMI.MyPopUp = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.Popup, true).Create(null) as cdeNMI.INMIPopUp;
        cdeNMI.MyToolTip = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.ToolTip, true).Create(null) as cdeNMI.INMIToolTip;
        cdeNMI.MyShapeRecognizer = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.ShapeRecognizer, true) as cdeNMI.INMIShapeRecognizer;

        //Step 7: Switch to the correct language
        cdeNMI.TL.RegisterEvent("OnLCIDChanged", () => {
            //Step 8: if you want a screen manager - create it 
            if (cdeNMI.MyScreenManager || cdeNMI.MyLoginScreen) {
                return;
            }

            if (!cde.MyBaseAssets.MyCommStatus.IsUserLoggedIn && !cde.MyBaseAssets.MyServiceHostInfo.DoAllowAnonymous) {
                cdeNMI.MyLoginScreen = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.LoginScreen, true) as cdeNMI.INMILoginScreen;
                if (cdeNMI.MyLoginScreen) {
                    cdeNMI.MyLoginScreen.RegisterEvent("OnLogin", (s, pLoggedIn, pUserPreferences: cde.TheUserPreferences) => {
                        if (pLoggedIn) {
                            if (pUserPreferences.Transforms) {
                                const scr: HTMLScriptElement = document.createElement('script');
                                scr.type = "text/javascript";
                                scr.text = pUserPreferences.Transforms;
                                document.head.appendChild(scr);
                            }
                            cdeNMI.DoLoginSuccess(pUserPreferences);
                        }
                    });
                    cdeNMI.MyLoginScreen.Create(null);
                }
            } else {
                try {
                    if (!cde.MyBaseAssets.MyCommStatus.UserPref)
                        cde.MyBaseAssets.MyCommStatus.UserPref = JSON.parse(cde.MyBaseAssets.MyServiceHostInfo.InitUserPref);
                }
                catch (e) {
                    //ignored
                }
                cdeNMI.DoLoginSuccess(cde.MyBaseAssets.MyCommStatus.UserPref);
            }
        });
        cdeNMI.TL.SetLCID(cde.MyBaseAssets.MyServiceHostInfo.CurrentLCID);
    }

    export function DoLoginSuccess(pUserPreferences: cde.TheUserPreferences) {
        if (pUserPreferences) {
            if (pUserPreferences.ShowClassic === true || cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 5)
                cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.ScreenManager, "cdeNMI.TheScreenManagerClassic");
            else {
                if (cde.MyBaseAssets.MyServiceHostInfo.ScreenManagerClass) {
                    cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.ScreenManager, cde.MyBaseAssets.MyServiceHostInfo.ScreenManagerClass);
                } else {
                    cdeNMI.MyTCF.RegisterControlType(cdeNMI.cdeControlType.ScreenManager, "cdeNMI.TheScreenManagerModern");
                }
            }
            if (pUserPreferences.ThemeName === "Lite") {
                cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme = true;
                cdeNMI.ApplyTheme();
            } else if (pUserPreferences.ThemeName === "Dark") {
                cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme = false;
                cdeNMI.ApplyTheme();
            }
        }
        if (cdeNMI.MyScreenManager)
            return;
        cdeNMI.MyScreenManager = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.ScreenManager) as cdeNMI.INMIScreenManager;
        cdeNMI.MyScreenManager.RegisterEvent("OnIsLoaded", () => {
            if (cde.MyBaseAssets.MyServiceHostInfo.RedPill === true && cdeNMI.MyDemoScreens) {
                cdeNMI.MyDemoScreens.Show();
            }
        });
        if (cde.MyBaseAssets.MyServiceHostInfo.RequestGeoLocation === true) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    cde.MyCommChannel.SendQueued(null, eTheNMIEngine, eTheNMIEngine, "NMI_MY_LOCATION", (position.coords.longitude + ";" + position.coords.latitude + ";" + position.coords.accuracy), 0, 3, 0, null);
                });
            }
        }
        window.addEventListener("scroll", () => {
            cdeNMI.MyNMISettings.IsScrolling = true;
        });
        cdeNMI.MyScreenManager.Create(null);
        cdeNMI.MyScreenManager.CreateLoginButtonOnly();
        if (cde.MyBaseAssets.MyServiceHostInfo.DoAllowAnonymous && !cdeNMI.MyEngine)
            cdeNMI.MyScreenManager.GotoStationHome(false);        //Required only if no Login or Engine is present
    }
}