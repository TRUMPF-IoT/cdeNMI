// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    /**
     * TheScreenManager manages the main portal screen, screen navigation, login/off etc
     * */
    export class TheScreenManager extends TheNMIBaseControl implements cdeNMI.INMIScreenManager {
        constructor(pTarget: INMIControl) {
            super(null);
            this.MyBaseType = cdeControlType.ScreenManager;
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            cdeNMI.MyNMIPortal = new TheNMIScreen(null);
            cdeNMI.MyNMIPortal.MyFormID = "NMIPORTAL";
            cdeNMI.MyNMIPortal.MyScreenID = "MYNMIPORTAL";
            cdeNMI.MyNMIPortal.SetProperty("IsAlwaysVisible", true);
            let tPortal = document.getElementById("MyNMIPortal")
            if (!tPortal) {
                tPortal = document.createElement("div");
                tPortal.className = "cdeNMIPortal";
                tPortal.id = "MyNMIPortal";
                const tBody = document.getElementsByTagName("body");
                if (tBody)
                    document.body.insertBefore(tPortal, document.body.firstChild);
                else
                    document.appendChild(document.createElement("body")).appendChild(tPortal);
            }
            document.body.oncontextmenu = () => { return false; }
            cdeNMI.MyNMIPortal.SetElement(tPortal);
            this.RegisterScreen(cdeNMI.MyNMIPortal.MyScreenID, cdeNMI.MyNMIPortal as INMIScreen, true);

            this.IsBrowserFS();

            let mDivMainDashboard = document.getElementById("MyDashboard");
            if (!mDivMainDashboard) {
                mDivMainDashboard = document.createElement("div");
                mDivMainDashboard.className = "cdeMyDashboard";
                mDivMainDashboard.id = "MyDashboard";
                tPortal.appendChild(mDivMainDashboard);
            }

            this.divSideBarRight = document.getElementById("cdeSideBarRight") as HTMLDivElement;
            if (!this.divSideBarRight) {
                this.divSideBarRight = document.createElement("div");
                this.divSideBarRight.id = "cdeSideBarRight";
                this.divSideBarRight.className = "cdeSideBarRight cdeBlurBack";
                this.divSideBarRight.style.display = "none";

                const divSideBarRightHead: HTMLDivElement = document.createElement("div");
                divSideBarRightHead.id = "cdeInSideBarRightHeader";
                divSideBarRightHead.className = "cdeSideRightHeader";
                this.divSideBarRight.appendChild(divSideBarRightHead);

                const tCtrl: cdeNMI.INMIControl = new cdeNMI.TheNMIBaseControl();
                tCtrl.SetElement(divSideBarRightHead);

                const tDnPin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tCtrl, { ScreenID: this.MyScreenID, PostInitBag: ["Left=6", "Top=6", "ClassName=cdeDivDraw"] });
                tDnPin.SetProperty("OnClick", (val, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                    this.divSideBarRight.style.display = 'none';
                    this.divSideBarRight.classList.remove("cde-animate-right");
                });
                tDnPin.SetProperty("Content", "<i class='fa fa-2x'>&#xf061;</i>");

                const divSideBarRightIn: HTMLDivElement = document.createElement("div");
                divSideBarRightIn.id = "cdeInSideBarRight";
                this.divSideBarRight.appendChild(divSideBarRightIn);

                document.body.appendChild(this.divSideBarRight);
            }

            this.DocumentWidth = document.body.clientWidth + cdeNMI.GetSizeFromTile(1);
            this.SetElement(tPortal, false, mDivMainDashboard);
            this.IsLoaded = true;
            this.FireEvent(false, "OnIsLoaded", this.IsLoaded);
            return true;
        }

        RegisterEvents() {
            if (window.addEventListener) {
                window.addEventListener("resize", () => { this.ResizeEventHandler(); }, false);
                window.addEventListener("scroll", () => { this.ScollEventHandler(); }, false);
            }

            document.onkeydown = (evt) => {
                //var keyCode = evt ? (evt.which ? evt.which : evt.keyCode) : evt.keyCode;
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
                } else if (keyCode === 36 && cde.MyBaseAssets.MyServiceHostInfo.WasPortalRequested && cdeNMI.Key13Event === null) {
                    if (!cdeNMI.DisableKey36Event)
                        this.GotoStationHome(false);
                } else if (keyCode === 10009) {
                    if (cdeNMI.MyScreenManager)
                        cdeNMI.MyScreenManager.NavigateBack(false);
                } else if (keyCode === 39) {
                    cdeNMI.focusNextElement(false);
                } else if (keyCode === 37) {
                    cdeNMI.focusNextElement(true);
                }
                if (keyCode > 47 && keyCode < 58 && cdeNMI.Key13Event === null) {
                    this.TransitToScreenIDX(keyCode - 48);
                }
            };
            window.onpopstate = () => {
                this.NavigateBack(false);
            }

            if (!cde.MyBaseAssets.MyServiceHostInfo.DoAllowAnonymous) {
                if (!cde.MyBaseAssets.MyCommStatus.IsUserLoggedIn) {
                    cdeNMI.MyLoginScreen = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.LoginScreen, true) as cdeNMI.INMILoginScreen;
                    if (cdeNMI.MyLoginScreen) {
                        cdeNMI.MyLoginScreen.RegisterEvent("OnLogin", (s, p, t) => { this.HandleLogin(p, t); });
                        cdeNMI.MyLoginScreen.Create(null);
                        this.CreateLoginButtonOnly();
                    } else {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show("NMI Requires Login but no login provider found. Access is denied", true, null, null, () => {
                                cdeNMI.ResetBrowserToPortal();
                            });
                    }
                } else {
                    this.HandleLogin(true);
                }
            }

            if (cdeNMI.MyEngine) {
                cdeNMI.MyEngine.RegisterEvent("CDE_SETSTATUSMSG", (sender, a, b) => { this.SetStatusMsg(a, b); });
                cdeNMI.MyEngine.RegisterEvent("CDE_SETPLATFORM", (sender, pID) => { this.SetPlatform(pID); });
                if (cdeNMI.MyEngine.IsConnectedAndReady)
                    this.sinkEngineReady(cdeNMI.MyEngine, true);
                else
                    cdeNMI.MyEngine.RegisterEvent("EngineReady", (sender, bReady) => { this.sinkEngineReady(sender, bReady); });
            }
            else {
                this.sinkEngineReady(null, true);
            }
        }

        divSideBarRight: HTMLDivElement = null;

        MyNMIScreens: cdeNMI.INMIScreen[] = new Array<cdeNMI.INMIScreen>(); //All currently registered screens
        MyNavHistory: TheNavHistory[] = new Array<TheNavHistory>();         //Navigation Histor

        MyDrawOverlay: INMIControl = null;          // Draw / Annotation overlay
        MyMainBackButton: INMIControl = null;       // Main Back Button 
        MyPopupOverlay: INMIControl = null;

        CurrentScreen: cdeNMI.INMIScreen = null;    //The Current screen visible in the NMI
        CurrentView: TheNMIScene = null;            //CurrentView (scene) displayed
        StartView: TheNMIScene = null;              //Start View (scece) when user logs in

        IsHeaderVisible = true;            //Is the HEader visible or not
        IsBrowserFullscreen = false;            //Is the HEader visible or not
        WasLoginHandled = false;
        ScreenOrder = 0;                    //All Screens have a uinique order
        WaitingForScreen: string = null;            //Temporary screen shown until a screen has loaded
        public DocumentWidth = 0;

        public IsLoaded = false;

        RemoveAllScreens() {
            this.MyNMIScreens = new Array<cdeNMI.INMIScreen>(); //All currently registered screens
            this.MyNavHistory = new Array<TheNavHistory>();         //Navigation Histor
            let mDivMainDashboard = document.getElementById("MyDashboard") as HTMLDivElement;
            if (mDivMainDashboard)
                mDivMainDashboard.innerHTML = "";
            mDivMainDashboard = document.getElementById("MyDashboardLOGIN") as HTMLDivElement;
            if (mDivMainDashboard)
                mDivMainDashboard.innerHTML = "";
        }

        ResizeEventHandler() {
            this.DocumentWidth = document.body.clientWidth + cdeNMI.GetSizeFromTile(1);
            this.IsBrowserFS();
            this.FireEvent(true, "OnWindowResize");
        }

        ScollEventHandler() {
            this.FireEvent(true, "OnWindowScroll");
        }

        IsBrowserFS() {
            if (window.innerWidth === screen.width && window.innerHeight === screen.height) {
                if (!this.IsBrowserFullscreen) {
                    this.IsBrowserFullscreen = true;
                    this.FireEvent(true, "OnBrowserFullscreen", true);
                }
            } else {
                if (this.IsBrowserFullscreen) {
                    this.IsBrowserFullscreen = false;
                    this.FireEvent(true, "OnBrowserFullscreen", false);
                }
            }
        }

        public CreateLoginButtonOnly() {
            let tileButHeaderBtnLogin: cdeNMI.INMIButton;
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 0) {
                tileButHeaderBtnLogin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-5x' style='font-size:40px'>&#xf011;</span>", "ClassName=MyHeaderButton"] }) as cdeNMI.INMIButton;
                tileButHeaderBtnLogin.SetProperty("OnClick", (pSender: INMIControl, evt: MouseEvent) => {
                    if (evt.button === 2 && cde.MyBaseAssets.MyServiceHostInfo.WasPortalRequested === true) {
                        this.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
                    }
                    else
                        cdeNMI.ResetBrowserToPortal();
                });
            }
            else {
                tileButHeaderBtnLogin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.UserMenu).Create(null) as cdeNMI.INMIButton;
            }
            tileButHeaderBtnLogin.SetProperty("TabIndex", 15);

            let divHeadButtonContentRight = document.getElementById("HeaderButtonContentRight");
            if (!divHeadButtonContentRight) {
                divHeadButtonContentRight = document.createElement("div");
                divHeadButtonContentRight.className = "cdeHeaderButtonContentRight";
                divHeadButtonContentRight.id = "HeaderButtonContentRight";
                let tMyHeader = document.getElementById("MyHeader");
                if (!tMyHeader) {
                    tMyHeader = document.createElement("div");
                    tMyHeader.className = "cdeLogoffTopRight";
                    tMyHeader.id = "MyLogoffButton";
                    this.GetElement().parentNode.insertBefore(tMyHeader, this.GetElement().nextSibling);
                }
                tMyHeader.appendChild(divHeadButtonContentRight);
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1) {
                const tClock = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=2", "ControlTH=1"], PostInitBag: ["Title=" + cdeNMI.UpdateClock(), "ClassName=MyHeaderButton"] });
                tClock.SetProperty("Disabled", true);
                divHeadButtonContentRight.appendChild(tClock.GetElement());
                cdeNMI.StartClock(tClock);
            }
            divHeadButtonContentRight.appendChild(tileButHeaderBtnLogin.GetElement());
            if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.MyBaseAssets.MyCommStatus.UserPref.CurrentUserName)
                tileButHeaderBtnLogin.SetProperty("Caption", "<span class='fa fa-5x' style='font-size:40px'>&#xf2bd;</span></br>" + cde.MyBaseAssets.MyCommStatus.UserPref.CurrentUserName);
        }

        public SetApplicationBar() {
            //override if needed
        }

        public ShowCreateViewPopup() {
            const tGroup: cdeNMI.INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(null);
            tGroup.SetProperty("ClassName", "cdeTextCrop");
            const tFld2: TheFieldInfo = new TheFieldInfo(cdeControlType.SingleEnded, -1, "Name:", 2);
            tFld2.FormID = "SAVEVIEW";
            //var tEdit: ctrlEditBox = ctrlEditBox.Create(tGroup, null, new TheTRF("SceneName", 1, tFld2), "My View", false, "cdeInput cdeInputCenter");
            const tEdit: INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleEnded).Create(tGroup, { TRF: new TheTRF("SceneName", 1, tFld2), PostInitBag: ["ClassName=cdeInput cdeInputCenter", "iValue=My Scene"] })
            //ctrlSmartLabel.Create(tGroup, null, null, "Make Scene available to all user:");
            cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(tGroup, { PostInitBag: ["iValue=Make Scene available to all user:"] });
            //var tCheck: ctrlCheckBox = ctrlCheckBox.Create(tGroup, null, new TheTRF("IsPublic", 2, new TheFieldInfo(cdeControlType.SingleCheck, 3, "Is Public:", 2)), false, "yes");
            const tCheck = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleCheck).Create(tGroup, { TRF: new TheTRF("IsPublic", 2, new TheFieldInfo(cdeControlType.SingleCheck, 3, "Is Public:", 2)), PostInitBag: ["Title=yes"] })
            tCheck.SetProperty("Style", "float:none;");
            if (cdeNMI.MyPopUp) {
                const tPopup: INMIPopUp = cdeNMI.MyPopUp.Show("Name this Scene:", false, tGroup, 0, (obj: INMIPopUp) => {
                    const pC: INMIControl = obj.GetProperty("tEdit") as INMIControl;
                    const tCe: INMIControl = obj.GetProperty("tCheck") as INMIControl;
                    const tSceeneName: string = pC.GetProperty("Value");
                    if (tSceeneName && tSceeneName.length > 0) {
                        const tScene: TheNMIScene = new TheNMIScene();
                        tScene.FriendlyName = tSceeneName;
                        tScene.IsPublic = tCe.GetProperty("Value");
                        tScene.Screens = new Array<TheScreenTrans>();
                        for (const i in this.MyNMIScreens) {
                            if (this.MyNMIScreens.hasOwnProperty(i)) {
                                const tS: TheScreenTrans = new TheScreenTrans();
                                tS.ID = this.MyNMIScreens[i].MyScreenID;
                                tS.DashID = this.MyNMIScreens[i].GetProperty("DashID");
                                tS.IsVisible = this.MyNMIScreens[i].GetProperty("Visibility");
                                tS.IsPinned = this.MyNMIScreens[i].GetProperty("IsPinned");
                                tS.FldOrder = this.MyNMIScreens[i].GetProperty("FldOrder");
                                if (tS.IsVisible || tS.IsPinned)
                                    tScene.Screens.push(tS);
                            }
                        }
                        const tStr: string = JSON.stringify(tScene);
                        if (cdeNMI.MyEngine) {
                            cdeNMI.MyEngine.PublishToNMI("NMI_SAVE_SCENE:" + tSceeneName, tStr); //TODO: Add User Node ID
                            cdeNMI.ShowToastMessage("Scene " + tSceeneName + " saved!");
                        }
                    }
                });
                tPopup.SetProperty("tEdit", tEdit);
                tPopup.SetProperty("tCheck", tCheck);
                tPopup.SetProperty("YesLabel", "Save");
                tPopup.SetProperty("NoLabel", "Cancel");
            }
        }

        public SetView(pView: TheNMIScene, ClearScreens = false) {
            if (!pView)
                return;
            if (ClearScreens === true)
                this.ClearScenes();
            this.CurrentView = pView;
            if (cde.MyBaseAssets.MyServiceHostInfo.StartScreen)
                this.StartView = this.CurrentView;
            //this.ShowView();
        }

        public ShowView() {
            if (!this.CurrentView) return;
            for (const tScreen1 in this.MyNMIScreens) {
                if (this.MyNMIScreens.hasOwnProperty(tScreen1)) {
                    this.MyNMIScreens[tScreen1].SetProperty("IsPinned", false);
                    this.ShowHideScreen(this.MyNMIScreens[tScreen1]);
                }
            }
            let cntVisibleScreens = 0;
            let i: number;
            let tScreen: INMIScreen;
            for (i = 0; i < this.CurrentView.Screens.length; i++) {
                tScreen = this.GetScreenByID(this.CurrentView.Screens[i].ID);
                if (tScreen) {
                    if (cdeNMI.MyEngine)
                        cdeNMI.MyEngine.CheckDataToFetch(this.CurrentView.Screens[i].ID);
                    tScreen.SetProperty("IsPinned", this.CurrentView.Screens[i].IsPinned);
                    this.ShowHideScreen(tScreen, this.CurrentView.Screens[i].IsVisible);
                    tScreen.SetProperty("FldOrder", this.CurrentView.Screens[i].FldOrder);
                    if (this.CurrentView.Screens[i].IsVisible)
                        cntVisibleScreens++;
                } else {
                    if (cdeNMI.MyEngine)
                        cdeNMI.MyEngine.GetScreenMeta(this.CurrentView.Screens[i].DashID, false);
                }
            }
            const tArr: Array<TheScreenTrans> = cdeNMI.SortArray<TheScreenTrans>(this.CurrentView.Screens, "FldOrder", false, true);
            for (i = 0; i < tArr.length; i++) {
                tScreen = this.GetScreenByID(tArr[i].ID);
                this.MoveScreenToTop(tScreen);
            }
            if (cntVisibleScreens === this.CurrentView.Screens.length)
                this.CurrentView = null;
        }

        public RenderHeader(bIsVisible: boolean) {
            return;
        }

        public RequestPortalScreen(pForceLoad: boolean) {
            if (cdeNMI.MyEngine)
                cdeNMI.MyEngine.GetScreenMeta(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen, pForceLoad);
        }


        public SetPlatform(pID: number) {
            if (pID === 2)
                this.SetHoloLens();
        }


        public GetDeepLink(): string {
            const tFetch: string = this.CurrentScreen.MyScreenID + ';' + this.CurrentScreen.GetProperty("DashID") + ";-;" + this.CurrentScreen.GetProperty("ScreenTitle");
            cdeNMI.ShowToastMessage("Deep Link created!", tFetch);
            return tFetch;
        }

        public SetHoloLens(): string {
            document.body.style.background = "black";
            const t = (document.getElementById('MyNMIPortal'));
            if (t)
                t.style.marginTop = "0";
            cdeNMI.ShowToastMessage("Welcome to HoloLens Mode!");
            return "";
        }

        public ShowHideDrawOverlay() {
            if (!this.MyDrawOverlay) {
                cdeNMI.ShowToastMessage("Welcome to your Scratch Board", "You draw on the screen and save your drawings to your Relay");
                this.MyDrawOverlay = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.DrawOverlay).Create(cdeNMI.MyNMIPortal, { TRF: new TheTRF("ScratchBoard", 0, null), PostInitBag: ["ClassName=cdeDrawOverlay"] });
                this.MyDrawOverlay.SetProperty("IsSynced", true);
                this.MyDrawOverlay.SetProperty("ShowPlay", true);
                this.MyDrawOverlay.SetProperty("IsOverlay", true);
                this.MyDrawOverlay.SetProperty("ShowColors", true);
                this.MyDrawOverlay.SetProperty("AutoAdjust", true);
                this.MyDrawOverlay.RegisterEvent("OnSavePicture", (pEvent, para) => {
                    cdeNMI.ShowToastMessage("Drawing Saved", para[1]);
                });
            }
            else {
                if (cdeNMI.MyNMIPortal)
                    cdeNMI.MyNMIPortal.DeleteControl(this.MyDrawOverlay);
                this.MyDrawOverlay = null;
            }
        }

        sinkEngineReady(pSender: INMIEngine, bIsReady: boolean) {
            if (cde.MyBaseAssets.MyServiceHostInfo.DoAllowAnonymous || cde.MyBaseAssets.MyCommStatus.IsUserLoggedIn) {
                if (pSender === null || bIsReady) {
                    this.HandleLogin(true);
                }
            }
        }
        HandleLogin(pIsLoggedIn: boolean, tScreenParts?: string[]) {
            if (this.WasLoginHandled) return;
            if (pIsLoggedIn === true) {
                this.WasLoginHandled = true;
                this.SetApplicationBar();
                cde.MyBaseAssets.MyServiceHostInfo.WasPortalRequested = false;
                this.FireEvent(false, "OnHandleLogin", true);
                if (cde.MyBaseAssets.MyCommStatus.LastPortalScreen) {
                    if (cdeNMI.MyEngine)
                        cdeNMI.MyEngine.GetScreenMeta(cde.MyBaseAssets.MyCommStatus.LastPortalScreen, false);
                }
                else
                    this.RequestPortalScreen(false);
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.IsConnectedAndReady = true;
                    if (cde.MyBaseAssets.MyCommStatus.LastStartScreen) {
                        cdeNMI.MyEngine.GetScene(cde.MyBaseAssets.MyCommStatus.LastStartScreen);
                    } else if (cde.MyBaseAssets.MyServiceHostInfo.StartScreen) {
                        cdeNMI.MyEngine.GetScene(cde.MyBaseAssets.MyServiceHostInfo.StartScreen);
                    }
                } else {
                    this.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.StartScreen);
                }
            }
        }

        public SetStatusMsg(pStatusMsg: string, pState: number) {
            if (cdeNMI.MyLoginScreen)
                cdeNMI.MyLoginScreen.SetStatusMsg(pStatusMsg, pState);
            if (pState === 3) {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Show(pStatusMsg, true, null, null, () => {
                        cdeNMI.ResetBrowserToPortal();
                    });
                else
                    cdeNMI.ResetBrowserToPortal();
            }
        }

        public FindDashpanel(pScreenID: string, pID: string): cdeNMI.TheDashPanelInfo {
            pID = cde.GuidToString(pID);
            const tModel: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[pScreenID];
            if (!tModel) return null;
            for (let i = 0; i < tModel.MyDashPanels.length; i++) {
                if (cde.GuidToString(tModel.MyDashPanels[i].cdeMID) === pID) {
                    return tModel.MyDashPanels[i];
                }
            }
            return null;
        }

        public SetScreenState(pScreenID: string, pScreenName: string): string {
            if (cde.IsNotSet(pScreenID))
                pScreenID = cde.GuidToString(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
            const tDash = this.FindDashpanel(pScreenID, pScreenName);
            if (tDash) {
                if (tDash.IsFullSceen)
                    this.RenderHeader(false);
                else
                    this.RenderHeader(true);
                return cdeNMI.ThePB.GetValueFromBagByName(tDash.PropertyBag, "Title");
            }
            return cde.MyBaseAssets.MyServiceHostInfo.ApplicationTitle;
        }

        public ClearScenes() {
            this.CurrentScreen = null;
            for (const i in this.MyNMIScreens) {
                if (this.MyNMIScreens.hasOwnProperty(i)) {
                    this.MyNMIScreens[i].SetProperty("IsPinned", false);
                    this.ShowHideScreen(this.MyNMIScreens[i]);
                }
            }
        }
        public ClearAndGoHome() {
            this.ClearScenes();
            this.GotoStationHome(false);
        }

        public AreScreensPinned(pScreen: cdeNMI.INMIScreen): number {
            let tFound = 0;
            for (const i in this.MyNMIScreens) {
                if (this.MyNMIScreens.hasOwnProperty(i)) {
                    if (this.MyNMIScreens[i] !== pScreen && this.MyNMIScreens[i].GetProperty("IsPinned") === true) {
                        tFound++;
                    }
                }
            }
            return tFound;
        }

        public FindPinnedScreen(): cdeNMI.INMIScreen {
            for (const i in this.MyNMIScreens) {
                if (this.MyNMIScreens.hasOwnProperty(i)) {
                    if (this.MyNMIScreens[i].GetProperty("IsPinned") === true) {
                        return this.MyNMIScreens[i];
                    }
                }
            }
            return null;
        }

        public SetCurrentScreen(pScreen: cdeNMI.INMIScreen, pRowID?: string, pOwnerTable?: string) {
            this.CurrentScreen = pScreen;
            if (!pScreen)
                return;
            if (pRowID)
                this.CurrentScreen.SetProperty("TTSCookie", pRowID);
            else
                this.CurrentScreen.SetProperty("TTSCookie", null);
            if (this.CurrentScreen.MyNMIControl) {
                if (pRowID)
                    this.CurrentScreen.MyNMIControl.SetProperty("TTSCookie", pRowID);
                else
                    this.CurrentScreen.MyNMIControl.SetProperty("TTSCookie", null);
            }
            if (pOwnerTable) {
                this.CurrentScreen.SetProperty("MyOwnerTable", pOwnerTable);
                if (this.CurrentScreen.MyNMIControl)
                    this.CurrentScreen.MyNMIControl.SetProperty("MyOwnerTable", pOwnerTable);
            }
            if (cdeNMI.MyEngine)
                cdeNMI.MyEngine.PublishToNMI("NMI_SHOW_SCREEN" + (pRowID ? ":" + pRowID : ""), this.CurrentScreen.MyScreenID, this.CurrentScreen.MyFieldInfo ? this.CurrentScreen.MyFieldInfo.cdeN : null);
        }

        public GetCurrentScreen(): cdeNMI.INMIScreen {
            return this.CurrentScreen;
        }

        public GetScreenByID(pScreenID: string): cdeNMI.INMIScreen {
            pScreenID = cde.GuidToString(pScreenID);
            return this.MyNMIScreens[pScreenID];
        }

        public DeleteScreenByID(pScreenID: string, bDeleteKids: boolean): boolean {
            const tScreen: cdeNMI.INMIScreen = this.GetScreenByID(pScreenID);
            if (!tScreen) return false;
            if (bDeleteKids) {
                tScreen.Clear(bDeleteKids);
                if (this.MyNMIScreens.hasOwnProperty(pScreenID)) {
                    delete this.MyNMIScreens[pScreenID];
                }
            }
            return true;
        }

        public RegisterScreen(pID: string, pScreen: cdeNMI.INMIScreen, bRegisterOnly: boolean) {
            if (!pScreen)
                return;
            pID = cde.GuidToString(pID);
            this.MyNMIScreens[pID] = pScreen;
            pScreen.SetProperty("LastShow", new Date());
            if (bRegisterOnly)
                return;
            if (!this.CurrentScreen || this.CurrentScreen.MyScreenID !== pID)
                this.ShowHideScreen(pScreen);
        }

        public ShowHeader(bShow: boolean) {
            //override if needed
        }

        public ShowAllScreens() {
            for (const i in this.MyNMIScreens) {
                if (this.MyNMIScreens.hasOwnProperty(i)) {
                    if (this.MyNMIScreens[i].MyScreenID !== "CDELOGINSCREEN") {
                        if (cdeNMI.MyEngine)
                            cdeNMI.MyEngine.CheckDataToFetch(this.MyNMIScreens[i].MyScreenID);
                        this.ShowHideScreen(this.MyNMIScreens[i], true);
                    }
                }
            }
        }

        public TransitToWaitingScreen(pTargetScreen: string) {
            if (this.WaitingForScreen && cde.GuidToString(this.WaitingForScreen) === pTargetScreen) {
                this.TransitToScreen(this.WaitingForScreen, false, false);
                this.WaitingForScreen = null;
            }
        }


        public TransitToScreenIDX(pIDX: number) {
            if (this.CurrentScreen && this.CurrentScreen.GetProperty("IsDashboard")) {
                for (const tdx in this.CurrentScreen.MyChildren) {
                    const tS: cdeNMI.INMIControl = this.CurrentScreen.MyChildren[tdx];
                    if (tS && tS.MyRC >= 0 && tS.MyRC === pIDX) {
                        this.TransitToScreen(tdx);
                        break;
                    }
                }
            }
        }

        public TransitToScreen(pTargetScreen: string, MustExist = false, DontTryLoad = false, pCookie?: string, pOwnerTable?: string) {
            if (cde.CBool(cde.TheBaseAssets.IsConnectionDown()) === true) {
                cdeNMI.ResetBrowserToPortal();
                return;
            }
            if (!pTargetScreen)
                pTargetScreen = cde.MyBaseAssets.MyServiceHostInfo.PortalScreen;

            if (!cde.MyBaseAssets.MyServiceHostInfo.WasInitialScreenVisible) {
                if (cde.MyBaseAssets.MyServiceHostInfo.DoesRequireConfiguration && !cde.MyBaseAssets.MyServiceHostInfo.DoAllowAnonymous && cde.MyBaseAssets.MyServiceHostInfo.MainConfigScreen) {
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Show('Your Relay is not completely configured, yet. Do you want to do this now?', false, null, 1, (tPopup, parent, cookie) => {
                            cdeNMI.MyScreenManager.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.MainConfigScreen);
                        }, null, this, parent);
                }
            }

            if (this.MyPopupOverlay) {
                this.RemoveChild(this.MyPopupOverlay);
                this.MyPopupOverlay = null;
            }
            const tScrolPos: number = document.body.scrollTop;
            const tTargetScreen: string = cde.GuidToString(pTargetScreen);
            const tOldScreen: INMIScreen = this.GetCurrentScreen();
            this.SetCurrentScreen(null);

            for (const i in this.MyNMIScreens) {
                if (this.MyNMIScreens.hasOwnProperty(i)) {
                    if (i === tTargetScreen) {
                        if (tOldScreen && tOldScreen.MyScreenID === i) {
                            this.SetCurrentScreen(tOldScreen, pCookie, pOwnerTable);
                            break;
                        }
                        this.SetCurrentScreen(this.MyNMIScreens[i], pCookie, pOwnerTable);

                        let tScreenInfo: TheScreenInfo = null;
                        if (cdeNMI.MyEngine) {
                            tScreenInfo = cdeNMI.MyNMIModels[this.CurrentScreen.MyScreenID];
                            if (tScreenInfo && tScreenInfo.MyDashboard && tScreenInfo.MyDashboard["InitialState"] &&
                                (!tOldScreen || cde.GuidToString(tScreenInfo.MyDashboard["InitialState"]) !== tOldScreen.MyScreenID)) {
                                this.TransitToScreen(tScreenInfo.MyDashboard["InitialState"]);
                                return;
                            }
                            if (!DontTryLoad)
                                cdeNMI.MyEngine.CheckDataToFetch(pTargetScreen);
                        }

                        this.SetScreenState("", pTargetScreen);
                        this.ShowHideScreen(this.CurrentScreen, true);
                        this.MoveScreenToTop(this.CurrentScreen);
                        if (cde.CBool(this.CurrentScreen.GetProperty("IsPopup"))) {
                            this.MyPopupOverlay = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TouchOverlay).Create(this) as INMITouchOverlay;
                            this.MyPopupOverlay.SetProperty("ClassName", "cdePopupOverlay");
                            this.CurrentScreen.GetElement().style.position = "absolute";
                            this.CurrentScreen.GetElement().style.zIndex = "1100";
                            this.CurrentScreen.GetElement().style.left = (window.innerWidth / 2 - (this.CurrentScreen.GetElement().clientWidth / 2) + "px"); //TODO: Dont use hardcoded size 12
                            this.CurrentScreen.GetElement().className = "cdePopupTemplate cde-animate-opacity";
                            this.CurrentScreen.SetProperty("ClassName", "cdePopupContent");
                            this.CurrentScreen.SetProperty("OldScreen", tOldScreen.MyScreenID);
                        }
                        else {
                            if (tOldScreen && !this.CurrentScreen.HasRenderTarget)
                                this.ShowHideScreen(tOldScreen);

                            if (cde.MyCommChannel) {
                                const tScreenTrack: Array<cde.TheNV> = new Array<cde.TheNV>();
                                tScreenTrack["LSSC"] = pTargetScreen;
                                if (this.CurrentScreen.GetProperty("DashID"))
                                    tScreenTrack["LPS"] = this.CurrentScreen.GetProperty("DashID");
                                cde.MyCommChannel.UpdateCustomSettings(tScreenTrack);
                            }
                        }

                        //if (this.CurrentScreen.GetContainerElement() &&
                        //    this.CurrentScreen.GetProperty("IsDashboard") != true &&
                        //    this.CurrentScreen.GetContainerElement().clientWidth > cdeNMI.GetSizeFromTile(18)) //12 Must be device Width Dependent
                        //    this.CurrentScreen.ShowFullscreen(true);
                        //else
                        this.CurrentScreen.ShowFullscreen(false);
                        if (this.CurrentScreen.GetProperty("IsFullScreen"))
                            cdeNMI.TogglePortalFull(true);
                        else
                            cdeNMI.TogglePortalFull(false);
                        try {
                            if ((!this.CurrentScreen.MyFieldInfo || cde.CBool(this.CurrentScreen.MyFieldInfo["IsTemplate"]) !== true) && !cde.CBool(this.CurrentScreen.GetProperty("IsPopup"))) {
                                const tH: TheNavHistory = { ScreenID: pTargetScreen, ScrolPos: tScrolPos };
                                this.MyNavHistory.push(tH);
                                window.history.pushState(pTargetScreen, tTargetScreen);
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                if (this.MyMainBackButton) {
                                    if (this.MyNavHistory.length < 2)
                                        this.MyMainBackButton.SetProperty("Disabled", true);
                                    else
                                        this.MyMainBackButton.SetProperty("Disabled", false);
                                }
                            }
                        } catch (e) {
                            //ignored
                        }
                    } else {
                        if (this.MyNMIScreens[i] !== tOldScreen)
                            this.ShowHideScreen(this.MyNMIScreens[i]);
                    }
                }
            }
            if (!this.CurrentScreen) {
                this.SetCurrentScreen(this.GetScreenByID(pTargetScreen), pCookie, pOwnerTable);
                if (!this.CurrentScreen) {
                    if (MustExist) {
                        if (cdeNMI.MyEngine)
                            cdeNMI.MyEngine.PublishToNMI("NMI_GET_SCREEN", pTargetScreen);
                        this.WaitingForScreen = pTargetScreen;
                        return;
                    }
                    if (pTargetScreen === cde.MyBaseAssets.MyServiceHostInfo.StartScreen) {
                        if (!this.CurrentView)
                            this.CurrentView = this.StartView;
                        if (this.CurrentView) {
                            this.ShowView();
                            return;
                        } else {
                            this.WaitingForScreen = pTargetScreen;
                            return;
                        }
                    }
                    if (cde.MyBaseAssets.MyServiceHostInfo.StartScreen)
                        pTargetScreen = cde.MyBaseAssets.MyServiceHostInfo.StartScreen;
                    else
                        pTargetScreen = cde.MyBaseAssets.MyServiceHostInfo.PortalScreen;
                    this.MyNavHistory.push({ ScreenID: pTargetScreen, ScrolPos: tScrolPos });
                    if (this.MyMainBackButton)
                        this.MyMainBackButton.SetProperty("Disabled", false);
                    this.SetCurrentScreen(this.GetScreenByID(pTargetScreen), pCookie, pOwnerTable);
                }
                if (!this.CurrentScreen) {
                    if (cdeNMI.MyLoginScreen)
                        this.ShowHideScreen(cdeNMI.MyLoginScreen, true);
                    return;
                }
                if (!DontTryLoad && cdeNMI.MyEngine)
                    cdeNMI.MyEngine.CheckDataToFetch(pTargetScreen);
                this.ShowHideScreen(this.CurrentScreen, true);
            }
            if (!cde.MyBaseAssets.MyServiceHostInfo.WasInitialScreenVisible)
                cdeNMI.ResetKeyCorder();
            cde.MyBaseAssets.MyServiceHostInfo.WasInitialScreenVisible = true;
            if (pTargetScreen === cde.MyBaseAssets.MyServiceHostInfo.PortalScreen) {
                cdeNMI.cdeBlendInTiles('.cdeLiveTile');
                this.RenderHeader(true);
            }
            else {
                cdeNMI.cdeBlendInTiles('.cdeLiveTile');
            }
            this.CurrentView = null;
        }

        ShowHideScreen(pScreen: INMIScreen, doShow = false) {
            if (!pScreen)
                return;
            if (!doShow) {
                if (!pScreen.GetProperty("IsPinned") && cde.CBool(pScreen.GetProperty("IsAlwaysVisible")) !== true) {
                    if (pScreen.Visibility)
                        pScreen.OnUnload();
                    pScreen.SetProperty("Visibility", false);
                }
            } else {
                if (!pScreen.Visibility)
                    pScreen.OnLoad(true);
                pScreen.SetProperty("Visibility", true);
            }
        }

        public SwitchTheme(pToDark: boolean) {
            //overide if needed
        }

        public GotoStationHome(IsManual: boolean) {
            if (cde.MyBaseAssets.MyServiceHostInfo.StartScreen !== "")
                this.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.StartScreen, true);
            else
                this.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen, true);
        }

        ///Used by Convenience Apps
        public NavigateBack(DoHome: boolean) {
            if (cde.CBool(cde.TheBaseAssets.IsConnectionDown()) === true) {
                cdeNMI.ResetBrowserToPortal();
                return;
            }
            if (cdeNMI.MyPopUp)
                cdeNMI.MyPopUp.Hide(false);
            this.FireEvent(false, "NavigateBackClicked");
            if (this.MyNavHistory.length > 1) {
                let tH: TheNavHistory = this.MyNavHistory.pop();
                const tSP = tH.ScrolPos;
                tH = this.MyNavHistory.pop();
                this.TransitToScreen(tH.ScreenID);
                document.body.scrollTop = document.documentElement.scrollTop = tSP;
            }
            else
                this.GotoStationHome(true);
            if (this.MyMainBackButton) {
                if (this.MyNavHistory.length < 2)
                    this.MyMainBackButton.SetProperty("Disabled", true);
                else
                    this.MyMainBackButton.SetProperty("Disabled", false);
            }
        }

        public CntScreenPinned(): number {
            let cnt = 0;
            for (const i in this.MyNMIScreens) {
                if (this.MyNMIScreens.hasOwnProperty(i)) {
                    if (this.MyNMIScreens[i].GetProperty("IsPinned") === true)
                        cnt++;
                }
            }
            return cnt;
        }

        public MoveScreenToTop(pScreen: INMIScreen) {
            if (!pScreen)
                return;
            const tH: HTMLElement = pScreen.GetElement();
            const tParent: HTMLElement = tH.parentElement;
            if (!tParent) return;
            const tNode0 = tParent.children[0];
            if (tNode0 === tH) return;
            tH.parentElement.removeChild(tH);
            tParent.insertBefore(tH, tNode0);
            this.RenumberScreens();
        }

        public RenumberScreens() {
            const tRoot: HTMLDivElement = document.getElementById("MyDashboard") as HTMLDivElement;
            if (tRoot) {
                for (let i = 0; i < tRoot.children.length; i++) {
                    const tC: HTMLElement = tRoot.children[i] as HTMLElement;
                    const tc: string[] = tC.id.split('_');
                    if (tc.length > 1 && tc[0].toLowerCase() === "screen") {
                        const tScreen: INMIScreen = this.GetScreenByID(tc[1]);
                        if (tScreen)
                            tScreen.SetProperty("FldOrder", i);
                    }
                }
            }
        }

        public UpdateScreenStatus(mh: string, pIsDown: boolean) {
            for (const ts in this.MyNMIScreens) {
                if (this.MyNMIScreens[ts].MyHostNode === mh || this.MyNMIScreens[ts].GetProperty("IsDashboard") === true) {
                    if (ts === cde.GuidToString(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen))
                        continue;
                    this.MyNMIScreens[ts].SetProperty("IsOwnerDown:" + mh, pIsDown);
                }
            }
        }

        public GetScreenIndex(): number {
            return this.ScreenOrder++;
        }

        public GetScreenList(): string {
            let tLst = "";
            for (const tIdx in this.MyNMIScreens) {
                const tS: cdeNMI.INMIScreen = this.MyNMIScreens[tIdx];
                if (!tS || !tS.GetProperty("Description") || tIdx === "CDELOGINSCREEN" || (tS.MyHostNode !== cde.MyBaseAssets.MyCommStatus.FirstNodeID))
                    continue;
                tLst += ";" + cdeNMI.StripHTML(tS.GetProperty("Description")) + ":" + tIdx;
            }
            return tLst;
        }


        public IsScreenInView(pCurrentView: TheNMIScene, pID: string): boolean {
            if (!pCurrentView) return true;
            for (let i = 0; i < pCurrentView.Screens.length; i++) {
                if (pCurrentView.Screens[i].ID === pID) {
                    const tScreen: INMIScreen = this.GetScreenByID(pCurrentView.Screens[i].ID);
                    if (tScreen) {
                        tScreen.SetProperty("IsPinned", pCurrentView.Screens[i].IsPinned);
                        this.ShowHideScreen(tScreen, pCurrentView.Screens[i].IsVisible);
                        tScreen.SetProperty("FldOrder", pCurrentView.Screens[i].FldOrder);
                    }
                    return pCurrentView.Screens[i].IsVisible;
                }
            }
            return false;
        }

        public CreateHTMLScreen(pScreenID: string, pHTML: string): INMIScreen {
            const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(pScreenID);
            if (tScreen) {
                tScreen.CreateHTMLView(pHTML);
                tScreen.SetInitialized(true);
            }
            return tScreen;
        }
        public CreateScriptScreen(pScreenID: string, pScript: string): INMIScreen {
            const tScreen: INMIScreen = this.GetScreenByID(pScreenID);
            if (tScreen) {
                tScreen.CreateScriptInView(pScript);
                tScreen.SetInitialized(true);
            }
            return tScreen;
        }
        public CreateIFrameScreen(pScreenID: string, pURL: string): INMIScreen {
            const tScreen: INMIScreen = this.GetScreenByID(pScreenID);
            if (tScreen) {
                tScreen.SetProperty("Source", pURL);
                tScreen.SetInitialized(true);
            }
            return tScreen;
        }

        public CreateDataViewScreen(tModel: cdeNMI.TheScreenInfo, pMSG: cde.TSM, tTableName: string, pExtraInfo: string, pScreenID?: string, bForceInitData?: boolean, pRowMID?: string): INMIDataView {
            const tModelId = cde.GuidToString(tModel.cdeMID);
            if (pMSG && (typeof (pMSG.PLS) === "object" || (pMSG.PLS !== "" && pMSG.PLS !== "[]"))) {
                const tParts = pMSG.PLS.split(":-MODELUPDATE-:");
                const pMSGPLS: string = tParts[0];
                if (!tModel.MyStorageMirror[tTableName] || cde.CBool(bForceInitData) === true) // 
                    tModel.MyStorageMirror[tTableName] = (typeof (pMSGPLS) === "object" ? pMSGPLS : JSON.parse(pMSGPLS));
                else {
                    const tTable = (typeof (pMSGPLS) === "object" ? pMSGPLS : JSON.parse(pMSGPLS));
                    for (let c = 0; c < tTable.length; c++) {
                        const tLen: number = tModel.MyStorageMirror[tTableName].length;
                        let tFoundOne = false;
                        for (let tc = 0; tc < tLen; tc++) {
                            if (tModel.MyStorageMirror[tTableName][tc].cdeMID === tTable[c].cdeMID) {
                                tModel.MyStorageMirror[tTableName][tc] = tTable[c];
                                tFoundOne = true;
                                break;
                            }
                        }
                        if (!tFoundOne)
                            tModel.MyStorageMirror[tTableName][tLen] = tTable[c];
                    }
                }
                if (tParts.length > 1 && tModel.MyStorageMeta && (tModel.MyStorageMeta[tTableName] || cde.CBool(bForceInitData) === true)) {
                    const ttModel = JSON.parse(tParts[1]);
                    tModel.MyStorageMeta[tTableName] = ttModel;
                }
                if (cdeNMI.MyEngine)
                    cdeNMI.MyEngine.FireLazyLoaded(tModelId, tTableName, tModel.MyStorageMirror[tTableName]);
                if (pScreenID === "noview")
                    return null;
            }
            const tFormInfo: cdeNMI.TheFormInfo = (tModel && tModel.MyStorageMeta && tModel.MyStorageMeta[tTableName]) ? tModel.MyStorageMeta[tTableName] : null;
            let pTarget: INMIControl = null;
            if (pScreenID) {
                pTarget = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.BaseControl);
                pTarget.MyScreenID = cde.GuidToString(pScreenID);
                let tTargetElem: HTMLElement = document.getElementById('Content_' + pTarget.MyScreenID);
                if (!tTargetElem)
                    tTargetElem = document.getElementById(pTarget.MyScreenID);
                pTarget.SetElement(tTargetElem);
            }
            let tBaseControl: INMIDataView = null;
            const tScreen: cdeNMI.INMIScreen = cdeNMI.MyScreenManager && pScreenID ? cdeNMI.MyScreenManager.GetScreenByID(pScreenID) : null;
            if (tFormInfo) {
                const tTRF: TheTRF = cdeNMI.TheTRF.FromScreenForm(tModel, tTableName);
                if (tFormInfo.IsAlwaysEmpty === true)
                    tTRF.RowNo = -1;
                const tRef = cde.GuidToString(cdeNMI.ThePB.GetValueFromBagByName(tFormInfo.PropertyBag, "TableReference"));
                if (!pRowMID && tScreen && tScreen.GetProperty("TTSCookie")) {
                    pRowMID = tScreen.GetProperty("TTSCookie");
                }
                if (pRowMID) {
                    tTRF.RowID = pRowMID;
                    tTRF.RowNo = -1;
                    if (tRef)
                        tTableName = tRef;
                    if (!tModel.MyStorageMirror[tTableName]) {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show("Template in use but has no Table Reference");
                    } else {
                        const tLen: number = tModel.MyStorageMirror[tTableName].length;
                        for (let tc = 0; tc < tLen; tc++) {
                            if (tModel.MyStorageMirror[tTableName][tc].cdeMID === tTRF.RowID) {
                                tTRF.RowNo = tc;
                                break;
                            }
                        }
                    }
                }

                tBaseControl = cdeNMI.MyTCF.CreateNMIControl(tTRF.FldInfo.Type).Create(pTarget, { ScreenID: cde.GuidToString(tModel.MyDashboard.cdeMID), TRF: tTRF, PreInitBag: ["ExtraInfo=" + pExtraInfo, (tRef ? "TableReference=" + tRef : "")], PostInitBag: tFormInfo.PropertyBag }) as INMIDataView;
                if (tBaseControl && cdeNMI.MyTCF && pTarget) {
                    const tableTE = cdeNMI.MyTCF.GetRegisteredControl(pTarget.MyScreenID, "TE") as cdeNMI.INMITileEntry;
                    if (tableTE) {
                        tBaseControl.SetTE(tableTE);
                    }
                }
                if (tScreen) {
                    tBaseControl.OnLoaded();
                    if (tBaseControl && tBaseControl.MyFieldInfo)
                        cdeNMI.ThePB.SetPropertiesFromBag(tScreen, tBaseControl.MyFieldInfo.PropertyBag, null, false, false);
                    tScreen.SetInitialized(true);
                    if (tScreen.MySavePin)
                        tScreen.MySavePin.SetProperty("Visibility", true);
                    if (tScreen.MyRefreshPin && (!tRef || tRef.length === 0))
                        tScreen.MyRefreshPin.SetProperty("Visibility", true);
                    if (tBaseControl)
                        tScreen.MyNMIControl = tBaseControl;
                }

            }
            else {
                if (tScreen) {
                    const tToFetch: string = tTableName + ":CMyForm:" + tTableName + ":" + cde.GuidToString(tScreen.GetProperty("DashID")) + ":true:false";
                    if (cdeNMI.MyEngine) {
                        //cdeNMI.MyEngine.AddDataToFetch(tToFetch); //TODO: this was working before...some ID must be wrong
                        //cdeNMI.MyEngine.CheckDataToFetch(tTableName);
                    } else {
                        this.FireEvent(true, "FetchData", tToFetch);
                    }
                    return null;
                }
            }
            if (pScreenID)
                cdeNMI.MyTCF.RegisterControl("TABLES", pTarget.MyScreenID, tBaseControl);
            else
                cdeNMI.MyTCF.RegisterControl("TABLES", tTableName, tBaseControl);
            return tBaseControl;
        }


        public CreateLiveScreen(pModel: cdeNMI.TheScreenInfo): INMIDataView {
            const tModelId = cde.GuidToString(pModel.cdeMID);
            if (!cdeNMI.MyNMIModels[tModelId] || pModel.ForceReload)
                cdeNMI.MyNMIModels[tModelId] = pModel;
            else {
                if (!cdeNMI.MyNMIModels[tModelId].MyStorageMirror)
                    cdeNMI.MyNMIModels[tModelId].MyStorageMirror = [];
            }

            if (pModel && pModel.MyStorageInfo) {
                if (!cdeNMI.MyNMIModels[tModelId].MyStorageMeta)
                    cdeNMI.MyNMIModels[tModelId].MyStorageMeta = [];
                for (let i = 0; i < pModel.MyStorageInfo.length; i++) { //TODO: Check if there is better Way!
                    cdeNMI.MyNMIModels[tModelId].MyStorageMeta[tModelId] = pModel.MyStorageInfo[i];
                }
            }
            const pTarget: cdeNMI.INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.BaseControl);
            pTarget.MyScreenID = tModelId;
            const pTargetElem: HTMLElement = document.getElementById('Content_' + cde.GuidToString(tModelId));
            if (!pTargetElem) {
                //cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheNMIService:OnHandleMessage", "Target Element for Live Screen not found " + tModelId);
            } else {
                const tTRF: TheTRF = cdeNMI.TheTRF.FromScreenForm(pModel, tModelId);
                pTarget.SetElement(pTargetElem);
                const tBaseControl: cdeNMI.INMIDataView = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.FormView).Create(pTarget, { ScreenID: tModelId, TRF: tTRF, PreInitBag: ["ILF=true"] }) as INMIDataView;
                cdeNMI.MyTCF.RegisterControl("TABLES", tModelId, tBaseControl);
                const tScreen: cdeNMI.INMIScreen = cdeNMI.MyScreenManager && tModelId ? cdeNMI.MyScreenManager.GetScreenByID(tModelId) : null;
                if (tScreen) {
                    tScreen.SetInitialized(true);
                    if (tScreen.MySavePin)
                        tScreen.MySavePin.SetProperty("Visibility", true);
                    if (tScreen.MyRefreshPin)
                        tScreen.MyRefreshPin.SetProperty("Visibility", true);
                    if (tBaseControl)
                        tScreen.MyNMIControl = tBaseControl;
                }
                return tBaseControl;
            }
            return null;
        }

        public CreateDashboard(tModel: cdeNMI.TheScreenInfo, pInScreenGuid: string): INMIDashboard {
            let tModelId = cde.GuidToString(tModel.cdeMID);
            let IsModelReady = false;
            if (tModel.MyDashboard) {
                tModelId = cde.GuidToString(tModel.MyDashboard.cdeMID);
                if (!cdeNMI.MyNMIModels[tModelId] || tModel.ForceReload)
                    cdeNMI.MyNMIModels[tModelId] = tModel;
                else {
                    if (cdeNMI.MyNMIModels[tModelId] && !cdeNMI.MyNMIModels[tModelId].MyDashboard)
                        cdeNMI.MyNMIModels[tModelId].MyDashboard = tModel.MyDashboard;
                    if (!cdeNMI.MyNMIModels[tModelId].MyStorageMirror)
                        cdeNMI.MyNMIModels[tModelId].MyStorageMirror = [];
                }
                IsModelReady = true;
                cde.MyBaseAssets.MyServiceHostInfo.WasPortalRequested = true;
            }

            if (!cdeNMI.MyNMIModels[tModelId] || (IsModelReady && tModel.ForceReload)) {
                cdeNMI.MyNMIModels[tModelId] = tModel;
            }
            else {
                if (tModel && tModel.MyDashPanels && tModel.MyDashPanels.length > 0) {
                    const tExiting = {};
                    let j: number;
                    for (j = 0; j < cdeNMI.MyNMIModels[tModelId].MyDashPanels.length; j++) {
                        if (cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeN === tModel.cdeN) {
                            tExiting[cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeMID] = false;
                        }
                    }
                    for (let i = 0; i < tModel.MyDashPanels.length; i++) {
                        let tFoundOne = false;
                        for (j = 0; j < cdeNMI.MyNMIModels[tModelId].MyDashPanels.length; j++) {
                            if (tModel.MyDashPanels[i].cdeMID === cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeMID) {
                                cdeNMI.MyNMIModels[tModelId].MyDashPanels[j] = tModel.MyDashPanels[i];
                                tFoundOne = true;
                                tExiting[cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeMID] = true;
                                break;
                            }
                        }
                        if (!tFoundOne) {
                            cdeNMI.MyNMIModels[tModelId].MyDashPanels.push(tModel.MyDashPanels[i]);
                            tExiting[tModel.MyDashPanels[i].cdeMID] = true;
                        }
                    }
                    for (j = cdeNMI.MyNMIModels[tModelId].MyDashPanels.length - 1; j >= 0; j--) {
                        if (cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeN === tModel.cdeN && (!tExiting[cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeMID] || tExiting[cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeMID] === false)) {
                            if (cdeNMI.MyScreenManager)
                                cdeNMI.MyScreenManager.DeleteScreenByID(cdeNMI.MyNMIModels[tModelId].MyDashPanels[j].cdeMID, false);
                            cdeNMI.MyNMIModels[tModelId].MyDashPanels.splice(j, 1);
                        }
                    }
                }
            }
            if (tModel && tModel.MyStorageInfo) {
                if (!cdeNMI.MyNMIModels[tModelId].MyStorageMeta)
                    cdeNMI.MyNMIModels[tModelId].MyStorageMeta = [];
                for (let i = 0; i < tModel.MyStorageInfo.length; i++) { //TODO: Check if there is better Way!
                    cdeNMI.MyNMIModels[tModelId].MyStorageMeta[cde.GuidToString(tModel.MyStorageInfo[i].AssociatedClassName)] = tModel.MyStorageInfo[i];
                }
            }
            if (IsModelReady) {
                const tDash: INMIDashboard = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.Dashboard, true) as INMIDashboard;
                if (tDash)
                    tDash.Create(cdeNMI.MyScreenManager, { ScreenID: tModelId, PreInitBag: [pInScreenGuid] });
                return tDash;
            }
            return null;
        }
    }

    export class TheScreenManagerClassic extends cdeNMI.TheScreenManager {
        constructor() {
            super(null);
            this.MyBaseType = cdeControlType.ScreenManager;
        }

        MyHeaderTitle: INMIControl = null;
        MyThemeSwitch: INMIControl = null;
        mLogoButton: INMIControl = null;

        mDivHeaderButtons: HTMLElement;
        mDivHeaderTitle: HTMLElement;
        mDivHeadButtonContent: HTMLDivElement;
        MyHeader: HTMLElement;                      //The header of the NMI. Can be on top botto - up to the Screenmanager to decide. Default (Classic): on top

        mHeaderTileSize = 0;


        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyHeader = document.getElementById("MyHeader");
            if (!this.MyHeader) {
                this.MyHeader = document.createElement("div");
                this.MyHeader.className = "cdeHeader";
                this.MyHeader.id = "MyHeader";
                this.GetElement().parentNode.insertBefore(this.MyHeader, this.GetElement().nextSibling);
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 5) {
                const tHeaderBuffer = document.createElement("div");
                tHeaderBuffer.className = "cdeBottomSpacer";
                const tInBuff = document.createElement("div");
                tHeaderBuffer.style.height = "100px";
                tHeaderBuffer.style.width = "10px";
                tHeaderBuffer.appendChild(tInBuff);
                this.GetElement().parentNode.insertBefore(tHeaderBuffer, this.GetElement().nextSibling);
            }
            this.mDivHeaderButtons = document.getElementById("HeaderButtonContent");
            if (!this.mDivHeaderButtons) {
                this.mDivHeaderButtons = document.createElement("div");
                this.mDivHeaderButtons.id = "HeaderButtonContent";
                this.MyHeader.appendChild(this.mDivHeaderButtons);
            }
            let tTitle: string = cde.MyBaseAssets.MyServiceHostInfo.ApplicationTitle;
            this.mDivHeaderTitle = document.getElementById("cdeHeaderTitle");
            if (!this.mDivHeaderTitle) {
                this.mDivHeaderTitle = document.createElement("div");
                this.mDivHeaderTitle.className = "cdeMyHeaderTitle";
                this.mDivHeaderTitle.id = "cdeHeaderTitle";
                this.MyHeader.appendChild(this.mDivHeaderTitle);
            } else {
                tTitle = this.mDivHeaderTitle.innerHTML;
            }
            //this.MyHeaderTitle = ctrlSmartLabel.Create(null, null, null, this.cdeHeaderTitleTD.innerHTML, "span", false, "cdeMyHeaderTitle");
            this.MyHeaderTitle = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(null, { PreInitBag: ["Element=span"], PostInitBag: ["iValue=" + tTitle, "ClassName=cdeMyHeaderTitle"] });
            this.mDivHeaderTitle.innerHTML = "";
            this.mDivHeaderTitle.appendChild(this.MyHeaderTitle.GetElement());
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1 && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 5) {
                const tPortal = document.getElementById("MyNMIPortal") as HTMLDivElement;
                tPortal.style.marginTop = "78px";
            }
            this.RegisterEvents();
            return true;
        }

        public SetApplicationBar() {
            if (this.mDivHeadButtonContent) return;
            this.mDivHeadButtonContent = document.getElementById("HeaderButtonContent") as HTMLDivElement;
            if (!this.mDivHeadButtonContent) //No Applicatin Bar if HeaderButtonContent is missing
                return;

            this.MyMainBackButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa' style='font-size:40px'>&#xf359;</span>", "ClassName=MyHeaderButton"] });
            this.MyMainBackButton.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                this.NavigateBack(false);
            });
            this.MyMainBackButton.SetProperty("TabIndex", 5);
            this.MyMainBackButton.SetProperty("Disabled", true);
            this.MyMainBackButton.SetProperty("Visibility", this.IsBrowserFullscreen || cde.MyBaseAssets.MyServiceHostInfo.WebPlatform > 2 || cde.MyBaseAssets.MyServiceHostInfo.IsAppHosted === true);

            this.MyThemeSwitch = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa' style='font-size:40px'>&#xf185;</span>", "ClassName=cdeVertCenter"] });
            this.MyThemeSwitch.SetProperty("OnClick", () => cdeNMI.ToggleTheme());

            const tileButHeaderBtnTheme2 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa' style='font-size:40px'>&#xf0c7;</span>", "ClassName=cdeVertCenter"] });
            tileButHeaderBtnTheme2.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (e.button === 2) {
                    if (this.CurrentScreen) {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show(cde.MyBaseAssets.MyCommStatus.MyServiceUrl + "/nmi?CDEDL=" + this.CurrentScreen.MyScreenID + ";" + this.CurrentScreen.GetProperty("DashID"), true);
                    }
                    else {
                        if (this.StartView && this.StartView.FriendlyName === "MyHome") {
                            const tScene: TheNMIScene = this.StartView;
                            tScene.Screens = new Array<TheScreenTrans>();
                            for (const i in this.MyNMIScreens) {
                                if (this.MyNMIScreens.hasOwnProperty(i)) {
                                    const tS: TheScreenTrans = new TheScreenTrans();
                                    tS.ID = this.MyNMIScreens[i].MyScreenID;
                                    tS.DashID = this.MyNMIScreens[i].GetProperty("DashID");
                                    tS.IsVisible = this.MyNMIScreens[i].GetProperty("Visibility");
                                    tS.IsPinned = this.MyNMIScreens[i].GetProperty("IsPinned");
                                    tS.FldOrder = this.MyNMIScreens[i].GetProperty("FldOrder");
                                    if (tS.IsVisible || tS.IsPinned)
                                        tScene.Screens.push(tS);
                                }
                            }
                            const tStr: string = JSON.stringify(tScene);
                            if (cdeNMI.MyEngine) {
                                cdeNMI.MyEngine.PublishToNMI("NMI_SAVE_HOMESCENE", tStr); //TODO: Add User Node ID
                                cdeNMI.ShowToastMessage("My Home Scene updated!");
                            }
                        }
                    }
                    return;
                }
                this.ShowCreateViewPopup();
            });
            const tileButHeaderBtnTheme3 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa' style='font-size:40px'>&#xf1fc;</span>", "ClassName=cdeVertCenter"] });
            tileButHeaderBtnTheme3.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Hide(false);
                this.ShowHideDrawOverlay();
            });
            const tileButHeaderBtnTheme4 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa' style='font-size:40px'>&#xf021;</span>", "ClassName=cdeVertCenter"] });
            tileButHeaderBtnTheme4.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Hide(false);
                let bForce = false;
                if (e.button === 2) bForce = true;
                if (this.CurrentScreen && this.CurrentScreen !== this.GetScreenByID(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen)) {
                    if (this.CurrentScreen.MyRefreshButton) {
                        this.CurrentScreen.MyRefreshButton.DoFireClick(null);
                        return;
                    } else {
                        if (cdeNMI.MyEngine) {
                            const tFetch: string = 'NMI_GET_DATA:' + this.CurrentScreen.MyScreenID + ':' + this.CurrentScreen.GetProperty("ControlClass") + ':' + this.CurrentScreen.GetProperty("DashID") + ':true:' + bForce;
                            cdeNMI.MyEngine.PublishToNMI(tFetch, '', this.CurrentScreen.MyFieldInfo ? this.CurrentScreen.MyFieldInfo.cdeN : null);
                        }
                    }
                    return;
                }
                if (cde.MyBaseAssets.MyServiceHostInfo.StartScreen === "")
                    cdeNMI.MyNMIModels[cde.GuidToString(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen)] = null;
                if (cdeNMI.MyToast)
                    cdeNMI.MyToast.ShowToastMessage("Portal Refresh sent!", "Touch the home icon to see the changes", 10000);
                if (cdeNMI.MyEngine)
                    cdeNMI.MyEngine.RequestReloadModel(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
                this.RequestPortalScreen(cde.MyBaseAssets.MyServiceHostInfo.StartScreen ? true : bForce);
            });
            const InnerControlArray: Array<INMIControl> = new Array<INMIControl>();
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform < 2)
                InnerControlArray[0] = this.MyThemeSwitch;
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 0) {
                InnerControlArray[1] = tileButHeaderBtnTheme2;
                InnerControlArray[2] = tileButHeaderBtnTheme3;
                InnerControlArray[3] = tileButHeaderBtnTheme4;
            }

            this.mLogoButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.LogoButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1"] })
            this.mLogoButton.SetProperty("OnClick", (t: INMIControl, e: PointerEvent, pP: ThePointer) => {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Hide(false);
                if (e.button === 2)
                    this.ClearAndGoHome();
                else
                    this.GotoStationHome(false);
            })

            const tReveal = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.RevealButton).Create(null);
            tReveal.SetProperty("Image", this.mLogoButton);
            tReveal.SetProperty("TabIndex", 6);
            tReveal.SetProperty("ControlArray", InnerControlArray);
            if (this.mDivHeadButtonContent) {
                this.mDivHeadButtonContent.appendChild(tReveal.GetElement());
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform > 1 && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 4) {
                if (this.mDivHeadButtonContent) {
                    this.mDivHeadButtonContent.appendChild(this.MyThemeSwitch.GetElement());
                    this.mDivHeadButtonContent.appendChild(tileButHeaderBtnTheme4.GetElement());
                }
            }
            if (this.mDivHeadButtonContent) {
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1 || cde.MyBaseAssets.MyServiceHostInfo.IsAppHosted === true) {
                    if (cde.MyBaseAssets.MyServiceHostInfo.IsAppHosted)
                        this.MyMainBackButton.SetProperty("Visibility", true);
                    this.mDivHeadButtonContent.insertBefore(this.MyMainBackButton.GetElement(), this.mDivHeadButtonContent.children[0]);
                    this.RegisterEvent("OnBrowserFullscreen", (sender, para) => {
                        if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform < 2)
                            this.MyMainBackButton.SetProperty("Visibility", para);
                    })
                }
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 2)
                    this.SetHoloLens();
            }
            cdeNMI.ApplyTheme();
        }

        public SetStatusMsg(pStatusMsg: string, pState: number) {
            if (this.mLogoButton)
                this.mLogoButton.SetProperty("LogoState", pState);
            super.SetStatusMsg(pStatusMsg, pState);
        }

        public CreateLoginButtonOnly() {
            super.CreateLoginButtonOnly();
        }

        ResizeEventHandler() {
            super.ResizeEventHandler();
            if (this.MyHeaderTitle) {
                if (this.mHeaderTileSize === 0)
                    this.mHeaderTileSize = this.MyHeaderTitle.GetElement().parentElement.offsetWidth + cdeNMI.GetSizeFromTile(5);
                if (window.outerWidth < this.mHeaderTileSize)
                    this.MyHeaderTitle.SetProperty("Visibility", false);
                else
                    this.MyHeaderTitle.SetProperty("Visibility", true);
            }
        }

        public RenderHeader(bIsVisible: boolean) {
            return;
        }

        public ShowHeader(bShow: boolean) {
            if (!cde.CBool(bShow)) {
                if (this.MyHeader)
                    this.MyHeader.style.display = 'none';
            }
            else {
                if (this.MyHeader && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 2)
                    this.MyHeader.style.display = '';
            }
        }

        public SwitchTheme(bToDark: boolean) {
            if (this.MyThemeSwitch) {
                if (bToDark)
                    this.MyThemeSwitch.SetProperty("Title", "<span class='fa' style='font-size:40px'>&#xf185;</span>");
                else
                    this.MyThemeSwitch.SetProperty("Title", "<span class='fa' style='font-size:40px'>&#xf186;</span>");
            }
        }

        public SetHoloLens(): string {
            super.SetHoloLens();
            (document.getElementById('MyHeader')).style.display = "none";
            return "";
        }
    }


    export class TheScreenManagerModern extends cdeNMI.TheScreenManager {
        constructor() {
            super(null);
            this.MyBaseType = cdeControlType.ScreenManager;
        }

        MyHeaderTitle: INMIControl = null;
        MyThemeSwitch: INMIControl = null;
        MyLogoButton: INMIControl = null;

        mDivHeaderButtons: HTMLElement;
        mDivSideBar: HTMLElement;
        mDivHeaderTitle: HTMLElement;
        mDivScreenList: HTMLElement;
        mDivHeadButtonContent: HTMLDivElement;
        MyHeader: HTMLElement;                      //The header of the NMI. Can be on top botto - up to the Screenmanager to decide. Default (Classic): on top

        mHeaderTileSize = 0;
        mSideBarState = 0;


        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyHeader = document.getElementById("MyHeader");
            if (!this.MyHeader) {
                this.MyHeader = document.createElement("div");
                this.MyHeader.className = "cdeHeader";
                this.MyHeader.id = "MyHeader";
                this.GetElement().parentNode.insertBefore(this.MyHeader, this.GetElement().nextSibling);
            }
            this.mDivHeaderButtons = document.getElementById("HeaderButtonContent");
            if (!this.mDivHeaderButtons) {
                this.mDivHeaderButtons = document.createElement("div");
                this.mDivHeaderButtons.id = "HeaderButtonContent";
                this.MyHeader.appendChild(this.mDivHeaderButtons);
            }

            this.mDivSideBar = document.getElementById("cdeSideBar");
            if (!this.mDivSideBar && cde.MyBaseAssets.MyServiceHostInfo.ShowClassic!==true) {
                this.mDivSideBar = document.createElement("div");
                this.mDivSideBar.id = "cdeSideBar";
                this.mDivSideBar.className = "cdeSideBar";
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 5) {
                    this.mDivSideBar.style.marginBottom = "48px";
                }
                else
                    this.mDivSideBar.style.marginTop = "48px";
                this.MyHeader.parentNode.insertBefore(this.mDivSideBar, this.MyHeader.nextSibling);
            }
            this.mDivHeaderTitle = document.getElementById("cdeHeaderTitle");
            let tTitle: string = cde.MyBaseAssets.MyServiceHostInfo.ApplicationTitle;
            if (!this.mDivHeaderTitle) {
                this.mDivHeaderTitle = document.createElement("div");
                this.mDivHeaderTitle.className = "cdeMyHeaderTitleModern";
                this.mDivHeaderTitle.id = "cdeHeaderTitle";
                this.MyHeader.appendChild(this.mDivHeaderTitle);
            } else {
                tTitle = this.mDivHeaderTitle.innerHTML;
            }
            //this.MyHeaderTitle = ctrlSmartLabel.Create(null, null, null, this.cdeHeaderTitleTD.innerHTML, "span", false, "cdeMyHeaderTitle");
            this.MyHeaderTitle = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(null, { PreInitBag: ["Element=span"], PostInitBag: ["iValue=" + tTitle, "ClassName=cdeMyHeaderTitleModern"] });
            this.mDivHeaderTitle.innerHTML = "";
            this.mDivHeaderTitle.appendChild(this.MyHeaderTitle.GetElement());

            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1) {
                const tPortal = document.getElementById("MyNMIPortal") as HTMLDivElement;
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 5)
                    tPortal.style.marginTop = "50px";
            }
            this.RegisterEvents();
            return true;
        }

        public SetApplicationBar() {
            if (this.mDivHeadButtonContent) return;
            this.mDivHeadButtonContent = document.getElementById("HeaderButtonContent") as HTMLDivElement;
            if (!this.mDivHeadButtonContent) //No Applicatin Bar if HeaderButtonContent is missing
                return;

            this.MyMainBackButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px'>&#xf359;</span>", "ClassName=MyHeaderButton", "PixelHeight=48"] });
            this.MyMainBackButton.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                this.NavigateBack(false);
            });
            this.MyMainBackButton.SetProperty("TabIndex", 5);
            this.MyMainBackButton.SetProperty("Disabled", true);
            this.MyMainBackButton.SetProperty("Visibility", false);

            const tIconGroup: INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(null, { PreInitBag: ["ControlTW=4", "ControlTH=1", "TileFactorY=2"] });
            tIconGroup.SetProperty("ClassName", "cdeSideTiles");
            if (this.mDivSideBar)
                this.mDivSideBar.appendChild(tIconGroup.GetElement());

            const tHomeButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tIconGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px'>&#xf015;</span>", "ClassName=cdeVertCenter"] });
            tHomeButton.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Hide(false);
                if (e.button === 2)
                    this.ClearAndGoHome();
                else {
                    this.GotoStationHome(false);
                }
                this.ToggleSideBar(2);
            });

            this.MyThemeSwitch = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tIconGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px'>&#xf185;</span>", "ClassName=cdeVertCenter"] });
            this.MyThemeSwitch.SetProperty("OnClick", () => cdeNMI.ToggleTheme());

            const tileButHeaderBtnTheme2 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tIconGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px'>&#xf0c7;</span>", "ClassName=cdeVertCenter"] });
            tileButHeaderBtnTheme2.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (e.button === 2) {
                    if (this.CurrentScreen) {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show(cde.MyBaseAssets.MyCommStatus.MyServiceUrl + "/nmi?CDEDL=" + this.CurrentScreen.MyScreenID + ";" + this.CurrentScreen.GetProperty("DashID"), true);
                    }
                    else {
                        if (this.StartView && this.StartView.FriendlyName === "MyHome") {
                            const tScene: TheNMIScene = this.StartView;
                            tScene.Screens = new Array<TheScreenTrans>();
                            for (const i in this.MyNMIScreens) {
                                if (this.MyNMIScreens.hasOwnProperty(i)) {
                                    const tS: TheScreenTrans = new TheScreenTrans();
                                    tS.ID = this.MyNMIScreens[i].MyScreenID;
                                    tS.DashID = this.MyNMIScreens[i].GetProperty("DashID");
                                    tS.IsVisible = this.MyNMIScreens[i].GetProperty("Visibility");
                                    tS.IsPinned = this.MyNMIScreens[i].GetProperty("IsPinned");
                                    tS.FldOrder = this.MyNMIScreens[i].GetProperty("FldOrder");
                                    if (tS.IsVisible || tS.IsPinned)
                                        tScene.Screens.push(tS);
                                }
                            }
                            const tStr: string = JSON.stringify(tScene);
                            if (cdeNMI.MyEngine) {
                                cdeNMI.MyEngine.PublishToNMI("NMI_SAVE_HOMESCENE", tStr);   //TODO: add User Node ID
                                cdeNMI.ShowToastMessage("My Home Scene updated!");
                            }
                        }
                    }
                    return;
                }
                this.ShowCreateViewPopup();
                this.ToggleSideBar(2);
            });
            const tileButHeaderBtnTheme3 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tIconGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px'>&#xf1fc;</span>", "ClassName=cdeVertCenter"] });
            tileButHeaderBtnTheme3.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Hide(false);
                this.ToggleSideBar(2);
                this.ShowHideDrawOverlay();
            });
            const tileButHeaderBtnTheme4 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tIconGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px'>&#xf021;</span>", "ClassName=cdeVertCenter"] });
            tileButHeaderBtnTheme4.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Hide(false);
                this.ToggleSideBar(2);
                let bForce = false;
                if (e.button === 2) bForce = true;
                if (this.CurrentScreen && this.CurrentScreen !== this.GetScreenByID(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen)) {
                    if (this.CurrentScreen.MyRefreshButton) {
                        this.CurrentScreen.MyRefreshButton.DoFireClick(null);
                        return;
                    } else {
                        if (cdeNMI.MyEngine) {
                            const tFetch: string = 'NMI_GET_DATA:' + this.CurrentScreen.MyScreenID + ':' + this.CurrentScreen.GetProperty("ControlClass") + ':' + this.CurrentScreen.GetProperty("DashID") + ':true:' + bForce;
                            cdeNMI.MyEngine.PublishToNMI(tFetch, '', this.CurrentScreen.MyFieldInfo ? this.CurrentScreen.MyFieldInfo.cdeN : null);
                        }
                    }
                    return;
                }
                if (cde.MyBaseAssets.MyServiceHostInfo.StartScreen === "")
                    cdeNMI.MyNMIModels[cde.GuidToString(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen)] = null;
                if (cdeNMI.MyToast)
                    cdeNMI.MyToast.ShowToastMessage("Portal Refresh sent!", "Touch the home icon to see the changes", 10000);
                if (cdeNMI.MyEngine)
                    cdeNMI.MyEngine.RequestReloadModel(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
                this.RequestPortalScreen(cde.MyBaseAssets.MyServiceHostInfo.StartScreen ? true : bForce);
            });

            if (cde.MyBaseAssets.MyServiceHostInfo.RedPill) {
                const tSTL = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tIconGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px; color:red;'>&#xf0c7;</span>", "ClassName=cdeVertCenter"] });
                tSTL.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Hide(false);
                    this.ToggleSideBar(2);
                    cdeNMI.TL.SaveResources();
                });
            }

            this.MyLogoButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.LogoButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["ClassName=MyHeaderButton", "PixelHeight=48", "PixelWidth=48", "FontSize=48"] });
            this.MyLogoButton.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Hide(false);
                if (this.MyDrawOverlay)
                    this.ShowHideDrawOverlay();
                if (e.button === 2)
                    this.ClearAndGoHome();
                else {
                    this.ToggleSideBar(-1);
                }
            });

            if (this.mDivHeadButtonContent) {
                this.mDivHeadButtonContent.appendChild(this.MyLogoButton.GetElement());
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1 || cde.MyBaseAssets.MyServiceHostInfo.IsAppHosted) {
                    if (cde.MyBaseAssets.MyServiceHostInfo.IsAppHosted)
                        this.MyMainBackButton.SetProperty("Visibility", true);
                    this.mDivHeadButtonContent.insertBefore(this.MyMainBackButton.GetElement(), this.mDivHeadButtonContent.children[0]);
                    this.RegisterEvent("OnBrowserFullscreen", (sender, para) => {
                        this.MyMainBackButton.SetProperty("Visibility", para);
                    })
                }
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 2)
                    this.SetHoloLens();
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.HideHeader) {
                this.MyHeader.style.display = "none";
                const tPortal = document.getElementById("MyNMIPortal") as HTMLDivElement;
                tPortal.style.marginTop = "0px";
            }
            //this.CreateLoginButtonOnly();

            this.mDivScreenList = document.createElement("div");
            this.mDivScreenList.className = "cdeScreenList";
            this.mDivScreenList.id = "cdeScreenList";
            if (this.mDivSideBar)
                this.mDivSideBar.appendChild(this.mDivScreenList);

            cdeNMI.ApplyTheme();
        }

        public SetStatusMsg(pStatusMsg: string, pState: number) {
            if (this.MyLogoButton) {
                if (pState === 1)
                    this.MyLogoButton.SetProperty("Reset", 1);
                else
                    this.MyLogoButton.SetProperty("LogoState", pState);
            }
            super.SetStatusMsg(pStatusMsg, pState);
        }

        CreateScreenList() {
            if (!this.mDivScreenList)
                return;
            this.mDivScreenList.innerHTML = "";
            const tAllScreens: Array<INMIScreen> = cdeNMI.SortNamedArray<INMIScreen>(this.MyNMIScreens, "LastShow", false, true);
            for (const idx in tAllScreens) {
                const tScreen: INMIScreen = this.GetScreenByID(idx);
                if (!tScreen || !tScreen.GetInitialized() || (tScreen.MyFieldInfo && cde.CBool(tScreen.MyFieldInfo["HideFromSideBar"]) === true) || cde.CBool(tScreen.GetProperty("HideFromSideBar")) === true)
                    continue;
                let tTitle = "";
                tTitle = tScreen.GetProperty("ScreenTitle");
                if (!tTitle)
                    tTitle = tScreen.GetProperty("Title");
                if (!tTitle)
                    tTitle = tScreen.GetProperty("Caption");
                if (tTitle && tTitle.endsWith("-HIDE"))
                    continue;
                let tIcon = "<span class='fa fa-2x' style='vertical-align:middle;'>&#xf03e;</span>";
                if (tScreen.GetProperty("SideBarTitle")) {
                    tTitle = tScreen.GetProperty("SideBarTitle");
                }
                if (!tTitle)
                    continue;
                const nTitle = cdeNMI.StripHTML(tTitle);
                if (nTitle !== tTitle) {
                    if (tTitle.indexOf("'fa") >= 0 || tTitle.indexOf("\"fa") >= 0) {
                        if (tTitle.indexOf("fa fa") > 0 && tTitle.length > 32) {
                            const tP = tTitle.indexOf("</i>");
                            if (tP >= 0) {
                                tIcon = tTitle.substr(0, tP + 4).replace("fa-5x", "fa-2x");
                                tTitle = cdeNMI.StripHTML(tTitle.substr(tP + 4));
                            }
                        } else {
                            tTitle = nTitle;
                        }
                    }
                    else
                        tTitle = nTitle;
                }
                if (tScreen.GetProperty("SideBarIconFA")) {
                    tIcon = "<span class='fa fa-2x' style='vertical-align:middle;'>" + tScreen.GetProperty("SideBarIconFA") + "</span>";
                }
                if (nTitle.startsWith("Loading..."))
                    continue;
                if (nTitle === "")
                    tTitle = "No Title - due to html strip";
                const tIconGroup: INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(null, { PreInitBag: ["ControlTH=1", "TileFactorY=2"], PostInitBag: ["TileWidth=4"] });
                this.mDivScreenList.appendChild(tIconGroup.GetElement());

                const tFormImg = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tIconGroup, { PreInitBag: ["ControlTH=1", "TileFactorY=2"], PostInitBag: ["TileWidth=4", "Title=" + tIcon + "&nbsp;&nbsp;" + tTitle, "ClassName=cdeScreenListButton"] });
                tFormImg.SetProperty("Cookie", idx);
                tFormImg.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: ThePointer) => {
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Hide(false);
                    this.ToggleSideBar(2);
                    const tIDX = sender.GetProperty("Cookie");
                    this.TransitToScreen(tIDX);
                });
            }
        }


        ToggleSideBar(pSetState: number) {
            if (!this.mDivSideBar)
                return;
            if (pSetState >= 0)
                this.mSideBarState = pSetState;
            switch (this.mSideBarState) {
                case 0:
                    this.mDivSideBar.style.width = (cdeNMI.GetSizeFromTile(1) / 2) + "px";
                    this.mSideBarState = 1;
                    this.mDivSideBar.classList.remove("cde-animate-left")
                    this.mDivScreenList.style.bottom = ((cdeNMI.GetSizeFromTile(1) / 2) * 6) + "px";
                    this.CreateScreenList();
                    break;
                case 1:
                    this.mDivSideBar.style.width = cdeNMI.GetSizeFromTile(4) + "px";
                    if (!this.mDivSideBar.classList.contains("cde-animate-left"))
                        this.mDivSideBar.classList.add("cde-animate-left")
                    this.mSideBarState = 2;
                    this.mDivScreenList.style.bottom = ((cdeNMI.GetSizeFromTile(1) / 2) * 2) + "px";
                    this.CreateScreenList();
                    break;
                case 2:
                    this.mDivSideBar.style.width = "0px";
                    this.mDivSideBar.classList.remove("cde-animate-left")
                    this.mSideBarState = 0;
                    break;
            }
        }

        public CreateLoginButtonOnly() {
            let tileButHeaderBtnLogin: cdeNMI.INMIButton;
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 0) {
                tileButHeaderBtnLogin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=2", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa' style='font-size:24px'>&#xf2bd;</span>", "ClassName=MyHeaderButton", "PixelHeight=48"] }) as cdeNMI.INMIButton;
                tileButHeaderBtnLogin.SetProperty("OnClick", (pSender: INMIControl, evt: MouseEvent) => {
                    if (evt.button === 2 && cde.MyBaseAssets.MyServiceHostInfo.WasPortalRequested === true) {
                        this.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
                    }
                    else
                        cdeNMI.ResetBrowserToPortal();
                });
            }
            else {
                tileButHeaderBtnLogin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.UserMenu).Create(null, { PreInitBag: ["TileFactorY=2"] }) as cdeNMI.INMIButton;
            }
            tileButHeaderBtnLogin.SetProperty("TabIndex", 15);

            let divHeadButtonContentRight = document.getElementById("HeaderButtonContentRight") as HTMLDivElement;
            if (!divHeadButtonContentRight) {
                divHeadButtonContentRight = document.createElement("div");
                divHeadButtonContentRight.className = "cdeHeaderButtonContentRight";
                divHeadButtonContentRight.id = "HeaderButtonContentRight";
                let tMyHeader = document.getElementById("MyHeader");
                if (!tMyHeader) {
                    tMyHeader = document.createElement("div");
                    tMyHeader.className = "cdeLogoffTopRight";
                    tMyHeader.id = "MyLogoffButton";
                    this.GetElement().parentNode.insertBefore(tMyHeader, this.GetElement().nextSibling);
                }
                tMyHeader.appendChild(divHeadButtonContentRight);
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1) {
                const tClock = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorY=2"], PostInitBag: ["Title=" + cdeNMI.UpdateClock(2), "ClassName=cdeClock", "PixelHeight=48"] });
                tClock.SetProperty("Disabled", true);
                divHeadButtonContentRight.appendChild(tClock.GetElement());
                cdeNMI.StartClock(tClock, 2);
            }
            divHeadButtonContentRight.appendChild(tileButHeaderBtnLogin.GetElement());
        }

        ResizeEventHandler() {
            super.ResizeEventHandler();
            if (this.MyHeaderTitle) {
                if (this.mHeaderTileSize === 0)
                    this.mHeaderTileSize = this.MyHeaderTitle.GetElement().parentElement.offsetWidth + cdeNMI.GetSizeFromTile(5);
                if (window.outerWidth < this.mHeaderTileSize)
                    this.MyHeaderTitle.SetProperty("Visibility", false);
                else
                    this.MyHeaderTitle.SetProperty("Visibility", true);
            }
        }

        public RenderHeader(bIsVisible: boolean) {
            return;
        }

        public ShowHeader(bShow: boolean) {
            if (!cde.CBool(bShow)) {
                if (this.MyHeader)
                    this.MyHeader.style.display = 'none';
            }
            else {
                if (this.MyHeader && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 2)
                    this.MyHeader.style.display = '';
            }
        }

        public SwitchTheme(bToDark: boolean) {
            if (this.MyThemeSwitch) {
                if (bToDark)
                    this.MyThemeSwitch.SetProperty("Title", "<span class='fa' style='font-size:23px'>&#xf185;</span>");
                else
                    this.MyThemeSwitch.SetProperty("Title", "<span class='fa' style='font-size:23px'>&#xf186;</span>");
            }
        }

        public SetHoloLens(): string {
            super.SetHoloLens();
            (document.getElementById('MyHeader')).style.display = "none";
            return "";
        }

        public TransitToScreen(pTargetScreen: string, MustExist = false, DontTryLoad = false, pCookie?: string, pOwnerTable?: string) {
            this.ToggleSideBar(2);
            super.TransitToScreen(pTargetScreen, MustExist, DontTryLoad, pCookie, pOwnerTable);
        }
    }
}