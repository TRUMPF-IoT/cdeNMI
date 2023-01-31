// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class TheDashboard extends TheNMIBaseControl implements cdeNMI.INMIDashboard {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        mDashboardScreen: INMIScreen = null;
        mScreenIDs: string[] = null;
        mTileCount = 0;
        static AllTileCount = 0;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.Dashboard;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            this.SetupDashboard(this.GetSetting("ScreenGuid"));

            return true;
        }

        public SetupDashboard(pScreenID: string): INMIDashboard {
            const tScreenInfo: TheScreenInfo = cdeNMI.MyNMIModels[this.MyScreenID];
            if (!tScreenInfo || !tScreenInfo.MyDashboard)
                return;
            ThePB.ConvertPropertiesFromBag(tScreenInfo.MyDashboard);
            let IsNewDashboard = false;
            if (!pScreenID)
                pScreenID = tScreenInfo.MyDashboard.cdeMID;
            this.mDashboardScreen = cdeNMI.MyScreenManager ? cdeNMI.MyScreenManager.GetScreenByID(pScreenID) : null;
            if (!this.mDashboardScreen) {
                this.mDashboardScreen = new TheNMIScreen();
                this.mDashboardScreen.InitControl(null, null, tScreenInfo.MyDashboard.PropertyBag, cde.GuidToString(tScreenInfo.MyDashboard.cdeMID));
                this.mDashboardScreen.SetProperty("MyDashboard", this);
                IsNewDashboard = true;
                this.mDashboardScreen.SetProperty("Visibility", false);
            }
            this.mDashboardScreen.SetProperty("IsDashboard", true);
            if (this.mTileCount > 0 && tScreenInfo.MyDashboard["InitialState"] === "error")
                return;
            this.mDashboardScreen.Clear(false);
            this.mScreenIDs = [];
            this.SetElement(this.mDashboardScreen.GetElement());
            if (!tScreenInfo.MyDashboard["Title"] && tScreenInfo.MyDashboard.DashboardTitle)
                tScreenInfo.MyDashboard["Title"] = tScreenInfo.MyDashboard.DashboardTitle; //3.2 Compat
            if (tScreenInfo.MyDashboard["Title"] && tScreenInfo.MyDashboard["Title"].length > 0) {
                this.mDashboardScreen.SetProperty("Title", tScreenInfo.MyDashboard["Title"]);
            }

            let tDashPanels: TheDashPanelInfo[];
            try {
                for (const element of tScreenInfo.MyDashPanels) {
                    element["Category"] = cdeNMI.ThePB.GetValueFromBagByName(element.PropertyBag, "Category", true);
                    element["PanelTitle"] = cdeNMI.ThePB.GetValueFromBagByName(element.PropertyBag, "Caption");
                }
                tDashPanels = cdeNMI.SortArrayEx<TheDashPanelInfo>(tScreenInfo.MyDashPanels, "Category,FldOrder,PanelTitle", false, false);
            }
            catch (eee) {
                tDashPanels = tScreenInfo.MyDashPanels;
            }

            let lastCate = "";
            let tTileGroup: cdeNMI.INMIControl = null; 
            let tTileCount = 0;
            let i: number;
            for (i = 0; i < tDashPanels.length; i++) {
                const tCategory: string = tDashPanels[i]["Category"];
                if (i === 0 || lastCate !== tCategory && cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "Visibility") !== "false") {
                    let tTitle = "";
                    if (tCategory !== " NA" && !cde.IsNotSet(tCategory)) {
                        tTitle = tCategory;
                    }
                    if (tTitle.substring(tTitle.length - 5) === "-HIDE")
                        tTitle = " ";
                    tTileGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(null); 
                    tTileGroup.SetProperty("LabelElement", "h1");
                    tTileGroup.SetProperty("LabelClassName", "cdeDashCategory");
                    tTileGroup.SetProperty("ClassName", "cdeDashCategory cdeTiles");
                    if (tTitle.substring(tTitle.length - 5) !== "-NONE") {
                        let dots = 0;
                        for (const element of tTitle) {
                            if (element !== ".")
                                break;
                            dots++;
                        }
                        tTitle = tTitle.substring(dots);
                        tTileGroup.SetProperty("Caption", tTitle);
                    }
                    this.mDashboardScreen.AppendChild(tTileGroup);
                    lastCate = tCategory;
                }
                const tLabelClass: string = cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "CategoryLabelClassName");
                if (tLabelClass) {
                    tTileGroup.SetProperty("LabelClassName", tLabelClass);
                }
                let pDashType: string[] = new Array<string>();
                if (tDashPanels[i].ControlClass)
                    pDashType = tDashPanels[i].ControlClass.split(':');
                else
                    pDashType[0] = "";
                const tClass: string = cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "CategoryClassName");
                const tHideFromSideBar: boolean = cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "HideFromSideBar"));
                const tRSB: boolean = cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "RSB"));
                if (tClass)
                    tTileGroup.SetProperty("ClassName", tClass);

                let tOnClick = null;
                let tStyleExt = "";
                let IsForm = false;
                let tNeverHide = false;
                let tHasRenderTarget = false;
                let tTargetScreen: INMIScreen = null;
                let tPanelTitle: string = cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "Caption");
                if (!tPanelTitle) {
                    tPanelTitle = "";
                }
                switch (pDashType[0]) {
                    case "cdeUpdater":
                        tOnClick = () => { cdeNMI.RequestUpdate() };
                        tStyleExt = "background-color: green; color: white;";
                        break;
                    case "jsAction":
                        if (pDashType.length < 2) continue;
                        tOnClick = tDashPanels[i].ControlClass;
                        break;
                    case "CMyInfo":
                        break;
                    case "CMyNavigator":
                        if (pDashType.length > 1) {
                            tOnClick = () => {
                                if (cdeNMI.MyScreenManager)
                                    cdeNMI.MyScreenManager.TransitToScreen(pDashType[1]);
                            };
                            this.mScreenIDs.push(pDashType[1]);
                        }
                        break;
                    default:
                        {
                            tTargetScreen = cdeNMI.MyScreenManager ? cdeNMI.MyScreenManager.GetScreenByID(tDashPanels[i].cdeMID) : null;
                            let tForceLoad: boolean = cde.CBool(cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "ForceLoad")) || (tPanelTitle.substring(tPanelTitle.length - 5) !== "-HIDE" && (cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "HTMLUrl") !== null || cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "HTML") !== null)));
                            if (cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "RenderTarget")) {
                                tHasRenderTarget = true;
                                tNeverHide = cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "NeverHide"));
                                if (!tForceLoad)
                                    tForceLoad = tNeverHide;
                            }
                            let tLoadSubScreens: boolean = tForceLoad;
                            let tRRT = false;
                            if (!tTargetScreen) {
                                tTargetScreen = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.Screen, true) as INMIScreen;
                                if (!tTargetScreen)
                                    continue;
                                tTargetScreen.MyHostNode = tDashPanels[i].cdeN;
                                //debugger
                                tTargetScreen.InitControl(tHasRenderTarget ? null : cdeNMI.MyScreenManager, null, tDashPanels[i].PropertyBag, cde.GuidToString(tDashPanels[i].cdeMID));
                                if (!cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "IsPinned")) && !tNeverHide)
                                    tTargetScreen.SetProperty("Visibility", false);
                                if (tDashPanels[i].HtmlContent)
                                    tTargetScreen.AppendContent(tDashPanels[i].HtmlContent);
                                else {
                                    tTargetScreen.SetProperty("ClassName", pDashType[0]);
                                    tTargetScreen.AppendContent("<h1 class='cdeHeadline'>Loading...please wait</h1><progress>loading...</progress>");
                                }
                                tLoadSubScreens = true;
                                this.mDashboardScreen.MyChildren[cde.GuidToString(tDashPanels[i].cdeMID)] = tTargetScreen;
                            } else {
                                tRRT = true;
                            }
                            if (tLoadSubScreens || tRSB || tScreenInfo.ForceReload || tDashPanels[i].ControlClass === "CMyLiveScreen") {
                                if (cdeNMI.MyEngine) {
                                    if (pDashType.length > 1 && pDashType[1] !== "" && !cdeNMI.MyEngine.HasDataToFetch(cde.GuidToString(tDashPanels[i].cdeMID) + ":" + tDashPanels[i].ControlClass)) {
                                        cdeNMI.MyEngine.AddDataToFetch(cde.GuidToString(tDashPanels[i].cdeMID) + ":" + tDashPanels[i].ControlClass + ":" + cde.GuidToString(this.MyScreenID) + ":true");
                                        if (tForceLoad)
                                            cdeNMI.MyEngine.CheckDataToFetch(cde.GuidToString(tDashPanels[i].cdeMID));
                                    }
                                }
                                else {
                                    this.FireEvent(true, "FetchData", cde.GuidToString(tDashPanels[i].cdeMID) + ":" + tDashPanels[i].ControlClass + ":" + cde.GuidToString(this.MyScreenID) + ":true");
                                }
                            }
                            if (tDashPanels[i].Flags && (tDashPanels[i].Flags & 8) !== 0)
                                tTargetScreen.SetProperty("NoShowAll", true);
                            if (pDashType[0] === "CMyDashboard") {
                                tTargetScreen.SetProperty("IsDashboard", true);
                            }
                            tTargetScreen.SetProperty("ControlClass", tDashPanels[i].ControlClass);
                            tTargetScreen.SetProperty("DashID", this.MyScreenID);
                            let tSTitle: string = cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "ScreenTitle");
                            if (!tSTitle)
                                tSTitle = cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "Title");
                            tTargetScreen.SetProperty("ScreenTitle", tSTitle);
                            if (tPanelTitle.substring(tPanelTitle.length - 5) === "-HIDE" || tHideFromSideBar === true) {
                                tTargetScreen.SetProperty("HideFromSideBar", true);
                            }
                            tTargetScreen.SetProperty("Description", cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "Description"));
                            tTargetScreen.SetProperty("HidePins", cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "HidePins")));
                            tTargetScreen.SetProperty("HidePinPins", cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "HidePinPins")));
                            tTargetScreen.SetProperty("IsPopup", cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "IsPopup")));
                            tOnClick = (pSender: INMIControl, evt:MouseEvent, pointer:cdeNMI.ThePointer) => {
                                if (cdeNMI.MyScreenManager) {
                                    if (evt.button === 2) 
                                        cdeNMI.MyScreenManager.TransitToScreen(pSender.GetProperty("cdeMID"));
                                    else
                                        cdeNMI.MyScreenManager.TransitToScreen(pSender.GetProperty("DefaultPortal"));
                                }
                            };
                            this.mScreenIDs.push(tDashPanels[i].cdeMID);
                            if (cdeNMI.MyScreenManager && !tNeverHide) { // !tHasRenderTarget) {
                                cdeNMI.MyScreenManager.RegisterScreen(tTargetScreen.MyScreenID, tTargetScreen, true);
                                if (!tRRT)
                                    cdeNMI.MyScreenManager.TransitToWaitingScreen(cde.GuidToString(tDashPanels[i].cdeMID));
                            }
                            tTileCount++;
                            IsForm = true;
                        }
                        break;
                }

                if (tPanelTitle.substring(tPanelTitle.length - 5) !== "-HIDE" && !tNeverHide) {
                    const tTileButton: cdeNMI.INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(tTileGroup, { PreInitBag: ["IsCustomTile=" + cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "IsCustomTile")) ], PostInitBag: ["ControlTW=2", "ControlTH=2", "Title=" + tPanelTitle, "Style=" + tStyleExt] });
                    tTileButton.SetProperty("OnClick", tOnClick);
                    tTileButton.SetProperty("TabIndex", tDashPanels[i].FldOrder + 101);
                    if (IsForm) {
                        tTileButton.MyTRF = new cdeNMI.TheTRF(cde.GuidToString(tDashPanels[i].cdeO), 0, new cdeNMI.TheFieldInfo(cdeControlType.TileButton, 2, tPanelTitle, 2)); //.cdeO was .cdeMID
                        tTileButton.MyTRF.ModelID = this.MyScreenID;
                        tTileButton.MyFieldInfo = tTileButton.MyTRF.FldInfo;
                        tTileButton.MyFieldInfo.FldOrder = tDashPanels[i].FldOrder;
                        tTileButton.MyFieldInfo.cdeO = tDashPanels[i].cdeO;
                        tTileButton.MyFieldInfo.cdeN = tDashPanels[i].cdeN;
                        tTileButton.MyFieldInfo.cdeMID = tDashPanels[i].cdeMID;
                    } else {
                        tTileButton.SetProperty("UXID", cde.GuidToString(tDashPanels[i].cdeMID));
                    }
                    tTileButton.SetProperty("ID", "DASH_" + cde.GuidToString(tDashPanels[i].cdeMID));
                    tTileButton.RegisterNMIControl();
                    this.mDashboardScreen.MyChildren[cde.GuidToString(tDashPanels[i].cdeMID)] = tTileButton;
                    tTileButton.SetProperty("cdeMID", tDashPanels[i].cdeMID);
                    if (cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "DefaultPortal") != null)
                        tTileButton.SetProperty("DefaultPortal", cde.CStr(cdeNMI.ThePB.GetValueFromBagByName(tDashPanels[i].PropertyBag, "DefaultPortal")));
                    else
                        tTileButton.SetProperty("DefaultPortal", tDashPanels[i].cdeMID);
                    if (tDashPanels[i].PropertyBag) {
                        ThePB.SetPropertiesFromBag(tTileButton, tDashPanels[i].PropertyBag, tDashPanels); //ok..is after InitControl
                        if (tTileButton.GetProperty("IsRefresh"))
                            this.mDashboardScreen.MyRefreshButton = tTileButton;
                    }
                    if (cdeNMI.MyEngine && cdeNMI.MyEngine.IsNodeDown(tDashPanels[i].cdeN)) {
                        tTileButton.SetProperty("IsOwnerDown", true);
                    }
                    if (tTargetScreen) {
                        tTargetScreen.MyRC = this.mTileCount;
                        if (!tTargetScreen.GetProperty("NUITags"))
                            tTargetScreen.SetProperty("NUITags", "Screen " + TheDashboard.AllTileCount++);
                        if (tTargetScreen.MyNMIControl) {
                            tTargetScreen.MyNMIControl.FireEvent(true, "RRT");
                        }
                    }
                    this.mTileCount++;
                } else {
                    if (tTargetScreen)
                        tTargetScreen.SetProperty("IsHidden", true);
                }
            }

            if (tTileCount > 1) {
                if (cde.CBool(tScreenInfo.MyDashboard["HideShowAll"]) === false) {
                    this.mDashboardScreen.MyShowAllPin.SetProperty("Visibility", true);
                    this.mDashboardScreen.MyShowAllPin.SetProperty("OnClick", () => {
                        this.ShowAllScreens();
                    });
                }
            }
            this.mDashboardScreen.SetInitialized(true);

            if (IsNewDashboard) {
                if (!cde.MyBaseAssets.MyServiceHostInfo.WasInitialScreenVisible) {
                    if (cde.MyBaseAssets.MyCommStatus.LastStartScreen) {
                        cdeNMI.MyEngine.GetScene(cde.MyBaseAssets.MyCommStatus.LastStartScreen);
                    } else if (cde.MyBaseAssets.MyServiceHostInfo.StartScreen !== "" && tScreenInfo.MyDashboard["InitialState"] !== "error")
                        cdeNMI.MyScreenManager.GotoStationHome(false);
                    else {
                        if (tScreenInfo.MyDashboard["InitialState"] && tScreenInfo.MyDashboard["InitialState"] !== "error")
                            cdeNMI.MyScreenManager.TransitToScreen(tScreenInfo.MyDashboard["InitialState"]);
                        else {
                            cdeNMI.MyScreenManager.GotoStationHome(false);
                        }
                    }
                }
                if (cdeNMI.MyScreenManager) {
                    cdeNMI.MyScreenManager.RegisterScreen(this.mDashboardScreen.MyScreenID, this.mDashboardScreen, false);
                    cdeNMI.MyScreenManager.TransitToWaitingScreen(this.mDashboardScreen.MyScreenID);
                }
            }
        }

        public ShowAllScreens() {
            const mScreenIDs = this.mScreenIDs;
            for (const id in mScreenIDs) {
                if (Object.prototype.hasOwnProperty.call(mScreenIDs, id)) {
                    const tScreen: INMIScreen = cdeNMI.MyScreenManager ? cdeNMI.MyScreenManager.GetScreenByID(mScreenIDs[id]) : null;
                    if (tScreen && !cde.CBool(tScreen.GetProperty("NoShowAll"))) {
                        tScreen.SetProperty("IsPinned", true);
                        if (cdeNMI.MyEngine)
                            cdeNMI.MyEngine.CheckDataToFetch(mScreenIDs[id]);
                        const isVisible = tScreen.GetProperty("Visibility") ? false : true;
                        tScreen.SetProperty("Visibility", isVisible);
                        tScreen.ShowPin();
                    }
                }
            }
        }
    }
}