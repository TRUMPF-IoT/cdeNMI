// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    /**
    * Creates a new Screen Control that can host other controls and will be added to the NMI Screen Manager
    *
    * 4.1 Ready
     * tuned and cleaned
    */
    export class TheNMIScreen extends TheNMIBaseControl implements INMIScreen {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        divDragContent: HTMLDivElement = null;
        mDragButton: INMIControl = null;
        pos1 = 0;
        pos2 = 0;
        pos3 = 0;
        pos4 = 0;
        oldz = "";
        oldBC = "";
        ScreenScale = 0.0;
        IsDragging = false;

        MyScreenDIV: HTMLDivElement = null;
        MyScreen: HTMLDivElement = null; //BackCompat
        mDivDashboardContent: HTMLElement = null;

        DisallowHeaderToggle = false;
        mIsInitialized = false;
        IsIFrame = false;

        public MyHostNode = "";
        public MyRefreshButton: INMIControl = null;
        public MySavePin: INMIControl = null;
        public MyShowAllPin: INMIControl = null;
        public MyRefreshPin: INMIControl = null;
        MyCloseButton: INMIControl = null;
        MyPinButton: INMIControl = null;
        MyDrawPin: INMIControl = null;
        MyOverlay: INMICanvasDraw = null;

        MyPinArea: INMIControl = null;
        MyScreenTitle: INMIControl = null;
        public HasRenderTarget = false;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.Screen;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            let tRenderTarget: string = this.GetSetting("RenderTarget");
            this.divDragContent = document.getElementById("Screen_" + this.MyScreenID) as HTMLDivElement;
            if (!this.divDragContent) {
                this.divDragContent = document.createElement("div");
                this.divDragContent.id = "Screen_" + this.MyScreenID;
                this.divDragContent.style.position = "relative"; //V4.107: New...double check with all scenarios
                const tAdd: string = this.GetSetting("DashBoardID");
                if (document.getElementById(tRenderTarget) as HTMLDivElement)
                    this.HasRenderTarget = true;
                else
                    tRenderTarget = "MyDashboard" + (tAdd ? tAdd : "");
                let tMainDash = document.getElementById(tRenderTarget) as HTMLDivElement;
                if (!tMainDash) {
                    tMainDash = document.createElement("div");
                    tMainDash.className = "cdeMyDashboard";
                    tMainDash.id = "MyDashboard" + (tAdd ? tAdd : "");
                    const tBody = document.getElementsByTagName("body");
                    if (tBody)
                        document.body.insertBefore(tMainDash, document.body.firstChild);
                    else
                        document.appendChild(document.createElement("body")).appendChild(tMainDash);
                }
                if (cde.CBool(this.GetSetting("AllowDrag"))) {
                    this.MyScreenDIV = document.createElement('div');
                    this.MyScreenDIV.style.position = "absolute";
                    this.MyScreenDIV.style.overflow = "hidden";
                    this.MyScreenDIV.style.zIndex = "400";
                    this.divDragContent.appendChild(this.MyScreenDIV);
                    tMainDash.appendChild(this.divDragContent);// 
                    this.SetElement(this.divDragContent, false, this.MyScreenDIV);
                }
                else {
                    this.MyScreenDIV = this.divDragContent;
                    tMainDash.appendChild(this.MyScreenDIV);
                    this.SetElement(this.MyScreenDIV);
                }
            }
            else {
                this.divDragContent.style.position = "relative"; //V4.107: New...double check with all scenarios
                this.MyScreenDIV = this.divDragContent;
                this.SetElement(this.MyScreenDIV);
            }
            this.MyScreen = this.MyScreenDIV; //BackCompat
            this.MyScreenDIV.className = cde.MyBaseAssets.MyServiceHostInfo.ScreenClassName; // "cdeBrowserTop";
            if (this.GetSetting("ScreenClassName"))
                this.MyScreenDIV.className = this.GetSetting("ScreenClassName");
            if (cde.CBool(this.GetSetting("ShowFullScreen")) === true) {
                this.MyScreenDIV.style.width = "100%";
            }
            this.divDragContent.classList.add("cde-animate-opacity");

            if (!cde.CBool(this.GetSetting("NeverHide")) && !cde.CBool(this.GetSetting("HidePins")) && !cde.MyBaseAssets.MyServiceHostInfo.HideHeader && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 2 && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 4) {

                const IsTesla: boolean = (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 5);

                this.MyPinArea = cdeNMI.MyTCF.CreateBaseControl().Create(this);
                const tPinDiv: HTMLDivElement = document.createElement("div");
                if (IsTesla)
                    tPinDiv.className = "cdePinAreaTesla";
                else
                    tPinDiv.className = "cdePinArea";
                this.MyPinArea.SetElement(tPinDiv);

                this.MyScreenTitle = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.MyPinArea, { ScreenID: this.MyScreenID, PreInitBag: ["Element=h1"], PostInitBag: [(this.GetSetting("ScreenTitle") ? "iValue=" + this.GetSetting("ScreenTitle") : ""), "ClassName=cdeScreenTitle"] });

                const tAllPins = cdeNMI.MyTCF.CreateBaseControl().Create(this.MyPinArea);
                const tAllPinDiv: HTMLDivElement = document.createElement("div");
                tAllPinDiv.className = "cdeAllPinArea";
                tAllPins.SetElement(tAllPinDiv);

                if (!this.HasRenderTarget) {
                    if (!cde.CBool(this.GetSetting("HidePinPins"))) {

                        this.MyPinButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=" + (this.GetSetting("IsPinned") === true), "Right=0", "Top=6"] });
                        this.MyPinButton.SetProperty("OnClick", (val, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                            if (evt.button === 2) {
                                if (!cdeNMI.MyScreenManager)
                                    return;
                                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyScreenID);
                                if (tScreen) {
                                    if (cdeNMI.MyPopUp)
                                        cdeNMI.MyPopUp.Show('Are you sure you want to make this screen your home screen? ', false, null, 1, (tPopup: INMIPopUp, pParent: INMIDataView, cookie) => {
                                            this.SaveHomeScreen(cookie);
                                        }, null, tScreen);
                                    else
                                        this.SaveHomeScreen(tScreen);
                                }
                            }
                            else {
                                if (!cde.CBool(this.GetProperty("IsPinned"))) {
                                    this.SetProperty("IsPinned", true);
                                }
                                else {
                                    if (cdeNMI.MyScreenManager && (this !== cdeNMI.MyScreenManager.GetCurrentScreen() || cdeNMI.MyScreenManager.AreScreensPinned(this) > 0)) {
                                        this.SetProperty("Visibility", false);
                                        if (this === cdeNMI.MyScreenManager.GetCurrentScreen()) {
                                            const tNS: INMIScreen = cdeNMI.MyScreenManager.FindPinnedScreen();
                                            if (tNS)
                                                cdeNMI.MyScreenManager.SetCurrentScreen(tNS);
                                        }
                                    }
                                    this.SetProperty("IsPinned", false);
                                }
                                this.ShowPin();
                            }
                        });
                        let tPosRight = 35;
                        if (IsTesla) {
                            this.MyPinButton.SetProperty("Content", "<i class='fa fa-2x'>&#xf08d;</i>");
                            tPosRight = 60;
                        }
                        else
                            this.MyPinButton.SetProperty("Content", "<i class='fa'>&#xf08d;</i>");
                        this.ShowPin();

                        const tUpPin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=true", "Right="+ tPosRight, "Top=6", "ClassName=cdeDivUp"] });
                        tUpPin.SetProperty("OnClick", (val, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                            const tH: HTMLElement = this.GetElement();
                            const tParent: HTMLElement = tH.parentElement;
                            let tLPos = -1;
                            for (let index = 0; index < tH.parentElement.children.length; index++) {
                                if (tH.parentElement.children[index] === tH) {
                                    if (tLPos >= 0) {
                                        const tNode = tH.parentElement.children[tLPos];
                                        tH.parentElement.removeChild(tH);
                                        tParent.insertBefore(tH, tNode);
                                    }
                                    break;
                                }
                                if ((tH.parentElement.children[index] as HTMLLIElement).style.display !== 'none')
                                    tLPos = index;
                            }
                            if (cdeNMI.MyScreenManager)
                                cdeNMI.MyScreenManager.RenumberScreens();
                        });
                        if (IsTesla) {
                            tUpPin.SetProperty("Content", "<i class='fa fa-2x'>&#xf062;</i>");
                            tPosRight = 120;
                        }
                        else {
                            tUpPin.SetProperty("Content", "<i class='fa'>&#xf062;</i>");
                            tPosRight = 70;
                        }

                        const tDnPin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=true", "Right="+ tPosRight, "Top=6", "ClassName=cdeDivDown"] });
                        tDnPin.SetProperty("OnClick", (val: any, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                            const tH: HTMLElement = this.GetElement();
                            const tParent: HTMLElement = tH.parentElement;
                            let tLPos = -1;
                            for (let index = tH.parentElement.children.length - 1; index >= 0; index--) {
                                if (tH.parentElement.children[index] === tH) {
                                    if (tLPos < tH.parentElement.children.length - 1) {
                                        const tNode = tH.parentElement.children[tLPos + 1];
                                        if (tNode === tH) break;
                                        tH.parentElement.removeChild(tH);
                                        tParent.insertBefore(tH, tNode);
                                    } else {
                                        tH.parentElement.removeChild(tH);
                                        tParent.appendChild(tH);
                                    }
                                    break;
                                }
                                if ((tH.parentElement.children[index] as HTMLLIElement).style.display !== 'none')
                                    tLPos = index;
                            }
                            if (cdeNMI.MyScreenManager)
                                cdeNMI.MyScreenManager.RenumberScreens();
                        });
                        if (IsTesla) {
                            tDnPin.SetProperty("Content", "<i class='fa fa-2x'>&#xf063;</i>");
                        }
                        else {
                            tDnPin.SetProperty("Content", "<i class='fa'>&#xf063;</i>");
                        }
                    } else {
                        if (cde.CBool(this.GetSetting("IsPopup")) === true) {
                            this.MyCloseButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["Right=0", "Top=6", "ClassName=cdeDivSave"] });
                            this.MyCloseButton.SetProperty("OnClick", (val: any, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                                if (cdeNMI.MyScreenManager) {
                                    cdeNMI.MyScreenManager.TransitToScreen(this.GetProperty("OldScreen"));
                                }
                            });
                            this.MyCloseButton.SetProperty("Content", "<i class='fa'>&#xf410;</i>");
                        }
                    }
                }

                if (!IsTesla) {
                    this.MySavePin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=true", "Right=140", "Top=6", "ClassName=cdeDivSave"] });
                    this.MySavePin.SetProperty("OnClick", (val, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                        const tScreen: cdeNMI.INMIDataView = cdeNMI.MyTCF.GetRegisteredControl("TABLES", this.MyScreenID) as INMIDataView;
                        if (tScreen) {
                            if (evt.button === 2) {
                                if (cdeNMI.MyEngine) {
                                    cdeNMI.MyEngine.PublishToNMI("NMI_CLEAR_SCREEN:" + this.MyScreenID, tScreen.MyDataRow.cdeN);
                                    cdeNMI.ShowToastMessage("Screen options cleared");
                                } else
                                    cdeNMI.ShowToastMessage("No NMI Engine found - Screen options not cleared!");
                            } else {
                                if (cdeNMI.MyEngine) {
                                    const tScene: TheFOR = new TheFOR();
                                    tScene.ID = this.MyScreenID;
                                    tScene.TileWidth = tScreen.GetProperty("TileWidth");
                                    if (tScreen.GetProperty("StartGroup"))
                                        tScene.StartGroup = tScreen.GetProperty("StartGroup");
                                    tScene.Flds = new Array<TheFLDOR>();
                                    for (const i in tScreen.MyFormControls) {
                                        const tF: INMIControl = tScreen.MyFormControls[i];
                                        const tOpt: TheFLDOR = new TheFLDOR();
                                        tOpt.PO = [];
                                        if (tF.MyFieldInfo)
                                            tOpt.FldOrder = tF.MyFieldInfo.FldOrder;
                                        if (tF.MyDirtyList.length > 0) {
                                            for (const element of tF.MyDirtyList) {
                                                tOpt.PO.push(`${element}=${tF.GetProperty(element)}`);
                                            }
                                            tScene.Flds.push(tOpt);
                                        }
                                        if (tF.MyBaseType === cdeControlType.CollapsibleGroup) {
                                            if (tScene.TileWidth === null) {
                                                if (cde.CBool(tF.GetProperty("AllowHorizontalExpand")) === true)
                                                    tScene.TileWidth = tF.GetProperty("ControlTW");
                                                else
                                                    tScene.TileWidth = 0;
                                            }
                                            tOpt.PO.push("DoClose=" + !cde.CBool(tF.GetProperty("IsOpen")));
                                            if (cde.CInt(tF.GetProperty("TileWidth")) > 0)
                                                tOpt.PO.push("TileWidth=" + tF.GetProperty("TileWidth"));
                                            tScene.Flds.push(tOpt);
                                        }
                                    }
                                    const tStr: string = JSON.stringify(tScene);
                                    cdeNMI.MyEngine.PublishToNMI("NMI_SAVE_SCREEN:" + this.MyScreenID, tStr, tScreen.MyDataRow.cdeN);
                                    cdeNMI.ShowToastMessage("Screen options saved");
                                } else {
                                    cdeNMI.ShowToastMessage("No NMI Engine found - Screen options not saved");
                                }
                            }
                        }
                    });
                    this.MySavePin.SetProperty("Content", "<i class='fa'>&#xf0c7;</i>");
                    this.MySavePin.SetProperty("Visibility", false);

                    this.MyShowAllPin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=true", "Right=175", "Top=6", "ClassName=cdeDivSave"] });
                    this.MyShowAllPin.SetProperty("Content", "<i class='fa'>&#xf06e;</i>");
                    this.MyShowAllPin.SetProperty("Visibility", false);
                }

                this.MyRefreshPin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=true", "Left=0", "Top=6", "ClassName=cdeDivRefresh"] });
                this.MyRefreshPin.SetProperty("OnClick", (val, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                    if (!cdeNMI.MyEngine || !cdeNMI.MyScreenManager)
                        return;
                    const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyScreenID);
                    if (tScreen) {
                        if (this.MyNMIControl && this.MyNMIControl.ReloadData() === true)
                            return;
                        let bForce = false;
                        if (evt.button !== 2) bForce = true;
                        const tFetch: string = 'NMI_GET_DATA:' + this.MyScreenID + ':' + tScreen.GetProperty("ControlClass") + ':' + tScreen.GetProperty("DashID") + ':true:' + bForce;
                        cdeNMI.MyEngine.PublishToNMI(tFetch, '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                    }
                });
                if (IsTesla)
                    this.MyRefreshPin.SetProperty("Content", "<i class='fa fa-3x'>&#xf021;</i>");
                else
                    this.MyRefreshPin.SetProperty("Content", "<i class='fa'>&#xf021;</i>");
                this.MyRefreshPin.SetProperty("Visibility", false);

                if (cde.MyBaseAssets.MyServiceHostInfo.RedPill === true) {
                    this.MyDrawPin = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=true", "Right=105", "Top=6", "ClassName=cdeDivDraw"] });
                    this.MyDrawPin.SetProperty("OnClick", (val, evt: MouseEvent, pointer: cdeNMI.ThePointer) => {
                        if (!this.MyOverlay) {
                            const tcr = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.DrawOverlay);
                            tcr.MyFormID = this.MyScreenID;
                            this.MyOverlay = tcr.Create(this, { PreInitBag: ["HideClear=true", "EnableRecognizer=true"] }) as INMICanvasDraw;
                        }
                        else {
                            cdeNMI.UnselectAllControls();
                            this.RemoveChild(this.MyOverlay);
                            this.MyOverlay = null;
                        }
                    });
                    this.MyDrawPin.SetProperty("Content", "<i class='fa'>&#xf044;</i>");
                    this.MyDrawPin.SetProperty("Visibility", !cde.CBool(this.GetSetting("UseIFrame")));
                }

                if (cde.CBool(this.GetSetting("AllowDrag"))) {
                    this.mDragButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.PinButton).Create(tAllPins, { ScreenID: this.MyScreenID, PostInitBag: ["iValue=true", "Right=175", "Top=6", "ClassName=cdeDivDraw"] });
                    this.mDragButton.SetProperty("Content", "<i class='fa'>&#xF0b2;</i>");
                    this.mDragButton.SetProperty("HoverClassName", "cdeDragButton");
                    this.mDragButton.SetProperty("OnPointerDown", (sender, e) => {
                        if (this.IsDragging) {
                            this.closeDragElement(e);
                            return;
                        }
                        e = e || window.event;
                        e.preventDefault();
                        this.pos3 = e.clientX;
                        this.pos4 = e.clientY;
                        this.mDragButton.SetProperty("Foreground", "green");
                        this.IsDragging = true;
                        this.oldz = this.MyScreenDIV.style.zIndex;
                        this.MyScreenDIV.style.zIndex = "450";
                        document.onpointerup = (evt) => { this.closeDragElement(evt); }
                        document.onpointermove = (evt) => { this.elementDrag(evt); };
                    });
                }
            }

            if (cde.CBool(this.GetSetting("UseIFrame"))) {
                this.mDivDashboardContent = document.createElement("iframe");
                this.mDivDashboardContent.className = "cdeDashboardIFrame";
                this.mDivDashboardContent.style.width = "inherit";
                this.mDivDashboardContent.style.height = "inherit";
                this.IsIFrame = true;
                this.mDivDashboardContent.onload = (evt: Event) => {
                    this.FireEvent(true, "OnIFrameLoaded", evt);
                };
            }
            else
                this.mDivDashboardContent = document.createElement("div");
            this.mDivDashboardContent.id = "Content_" + this.MyScreenID;
            this.mDivDashboardContent.className = "CMyDashboard";
            if (cde.CBool(this.GetSetting("ShowFullScreen")) === true) {
                this.mDivDashboardContent.style.width = "100%";
                this.mDivDashboardContent.style.display = "flex";
                this.mDivDashboardContent.style.verticalAlign= "middle";
                this.mDivDashboardContent.style.height = (window.innerHeight - cdeNMI.GetSizeFromTile(1)) + "px";
            }
            this.MyScreenDIV.appendChild(this.mDivDashboardContent);

            this.MyContainerElement = this.mDivDashboardContent;

            if (cdeNMI.MyScreenManager) {
                this.SetProperty("FldOrder", cdeNMI.MyScreenManager.GetScreenIndex());
                if (cde.CBool(this.GetProperty("IsPopup"))) {
                    cdeNMI.MyScreenManager.RegisterEvent("OnWindowResize", () => { this.ResizePopup(); });
                    cdeNMI.MyScreenManager.RegisterEvent("OnWindowScroll", () => { this.ResizePopup(); });
                }
            }

            return true;
        }

        closeDragElement(e: Event) {
            e.stopPropagation();
            e.preventDefault();
            this.IsDragging = false;
            /* stop moving when mouse button is released:*/
            document.onpointermove = null;
            document.onpointerup = null;
            this.mDragButton.SetProperty("Foreground", null);

            this.MyScreenDIV.style.zIndex = this.oldz;
            this.ApplySkin();
        }

        oldTop = 0;
        oldLeft = 0;
        elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            this.pos1 = this.pos3 - e.clientX;
            this.pos2 = this.pos4 - e.clientY;
            this.pos3 = e.clientX;
            this.pos4 = e.clientY;

            if (this.pos1 === 0 && this.pos2 === 0) {
                this.closeDragElement(e);
                return;
            }
            this.IsDragging = true;
            // set the element's new position:
            this.oldTop = (this.oldTop - this.pos2)
            this.oldLeft = (this.oldLeft - this.pos1)
            this.MyScreenDIV.style.top = (this.oldTop) + "px";
            this.MyScreenDIV.style.left = (this.oldLeft) + "px";
        }

        SaveHomeScreen(tScreen: INMIScreen) {
            const tScene: TheNMIScene = new TheNMIScene();
            tScene.FriendlyName = "MyHome";
            tScene.IsPublic = false;
            tScene.Screens = new Array<TheScreenTrans>();
            const tS: TheScreenTrans = new TheScreenTrans();
            tS.ID = this.MyScreenID;
            tS.DashID = tScreen.GetProperty("DashID");
            let tStr = "RESET";
            if (tS.DashID) {
                tS.IsVisible = true;
                tS.IsPinned = false;
                tS.FldOrder = -1;
                tScene.Screens.push(tS);
                tStr = JSON.stringify(tScene);
            }
            if (cdeNMI.MyEngine)
                cdeNMI.MyEngine.PublishToNMI("NMI_SAVE_HOMESCENE", tStr);   
            cdeNMI.ShowToastMessage("Home Scene saved!");
        }

        public SetInitialized(bRegisterOnly: boolean) {
            this.mIsInitialized = true;
            if (cdeNMI.MyScreenManager && !cde.CBool(this.GetSetting("NeverHide"))) 
                cdeNMI.MyScreenManager.RegisterScreen(this.MyScreenID, this, bRegisterOnly);
            this.ResizePopup();
        }

        public ResizePopup() {
            if (cde.CBool(this.GetProperty("IsPopup"))) {
                this.GetElement().style.left = (window.innerWidth / 2 - (this.GetElement().clientWidth / 2) + "px");
                let tH = this.GetElement().clientHeight;
                if (tH === 0)
                    tH = cdeNMI.GetSizeFromTile(this.GetProperty("TileHeight"));
                this.GetElement().style.top = ((window.innerHeight / 2 - (tH / 2) + window.scrollY) + "px");
            }
        }

        public GetInitialized(): boolean {
            return this.mIsInitialized;
        }

        public ApplySkin() {
            if (!this.IsIFrame && cde.CBool(this.GetProperty("AllowScrolling")) && this.GetContainerElement())
                this.GetContainerElement().style.width = (this.MyScreenDIV.clientWidth + 20) + "px";
        }

        public SetProperty(pName: string, pValue) {
            if (pName.startsWith("IsOwnerDown")) {
                const tCmds = pName.split(':');
                if (tCmds.length < 2) return;
                if (pValue === true) {
                    if (this.GetProperty(pName) === true)
                        return;
                    if (this.GetProperty("IsDashboard") === true) {
                        for (const cl in this.MyChildren) {
                            const tBut = this.MyChildren[cl];
                            if (tBut && tBut.MyFieldInfo && tBut.MyFieldInfo.cdeN === tCmds[1])
                                tBut.SetProperty("IsOwnerDown", true);
                        }
                    } else {
                        if (!this.MyScreenDIV.classList.contains("cdeNodeGone"))
                            this.MyScreenDIV.classList.add("cdeNodeGone");
                    }
                }
                else {
                    if (this.GetProperty(pName) !== true)
                        return;
                    if (this.GetProperty("IsDashboard") === true) {
                        for (const cl in this.MyChildren) {
                            const tBut = this.MyChildren[cl];
                            if (tBut && tBut.MyFieldInfo && tBut.MyFieldInfo.cdeN === tCmds[1])
                                tBut.SetProperty("IsOwnerDown", false);
                        }
                    } else {
                        this.MyScreenDIV.classList.remove("cdeNodeGone");
                    }
                }
            }
            if (pName === "Visibility" && cde.CBool(pValue) === false) {
                //debugger
            }
            if (pName === "ClassName" && this.GetContainerElement()) {
                this.GetContainerElement().className = pValue;
            } else if (pName === "ScreenClassName") {
                super.SetProperty("ClassName", pValue + " cde-animate-opacity");
            } else
                super.SetProperty(pName, pValue);
            if ((pName === "Value" || pName === "iValue" || pName === "Text" || pName === "Label" || pName === "Caption" || pName === "Title") && this.MyScreenTitle) {
                const tFormat: string = this.GetProperty("LabelFormat");
                if (tFormat)
                    pValue = tFormat.format(pValue);
                this.MyScreenTitle.SetProperty("Text", pValue);
            } else if ((pName === "LabelFormat" || pName === "ScreenTitle") && this.MyScreenTitle && pValue) {
                if (pValue.indexOf("{0}") >= 0)
                    pValue = pValue.format(this.GetProperty("iValue"));
                this.MyScreenTitle.SetProperty("Text", pValue);
            } else if (pName === "IsPinned") {
                this.ShowPin();
            } else if (pName === "Source" && this.IsIFrame) {
                (this.MyContainerElement as HTMLIFrameElement).src = pValue;
            } else if (pName === "OnIFRameLoaded" && this.IsIFrame) {
                this.RegisterEvent("OnIFrameLoaded", pValue);
            } else if (pName === "TileHeight" && this.GetContainerElement()) {
                if (!cde.CBool(this.GetSetting("HidePins")))
                    this.GetContainerElement().style.height = (this.GetElement().clientHeight - 44) + "px";    //44=39 +5
                else
                    this.GetContainerElement().style.height = "inherit";
            } else if (pName === "TileWidth") {
                this.ApplySkin();
            } else if (pName === "AllowScrolling" && this.GetContainerElement()) {
                this.GetContainerElement().style.overflow = "auto";
                this.ApplySkin();
            } else if (pName === "HidePins" && this.MyPinArea) {
                this.MyPinArea.SetProperty("Visibility", !cde.CBool(pValue));
            }
        }

        public OnLoad(bIsVisible?: boolean) {
            if (this.MyNMIControl)
                this.MyNMIControl.OnLoad(bIsVisible);
            super.OnLoad();
            this.SetProperty("LastShow", new Date());
            this.FireEvent(true, "OnLoaded");
            if (cde.CBool(this.GetProperty("IsPopup"))) {
                this.ResizePopup();
            }
        }

        public ShowPin() {
            if (!this.MyPinButton) return;
            if (cde.CBool(this.GetProperty("IsPinned")) === true) {
                this.MyPinButton.SetProperty("iValue", true);
                this.MyPinButton.SetProperty("ClassName", "cdePinDiv");
            }
            else {
                this.MyPinButton.SetProperty("ClassName", "cdePinDiv fa-rotate-45");
                this.MyPinButton.SetProperty("iValue", false);
            }
        }

        public ShowFullscreen(bFull: boolean) {
            if (this.MyScreenDIV) {
                this.SetProperty("IsFullScreen", bFull);
                if (bFull)
                    this.MyScreenDIV.style.maxWidth = "100%";
                else
                    this.MyScreenDIV.style.maxWidth = "";
            }
        }

        public Clear(bClearKids: boolean) {
            if (bClearKids)
                this.ClearChildren(bClearKids);
            if (this.divDragContent)
                this.divDragContent.classList.remove("cde-animate-opacity");
            this.GetContainerElement().innerHTML = "";
        }

        public ClearChildren(bClearKids: boolean) {
            if (!cdeNMI.MyScreenManager)
                return;
            for (const tIdx in this.MyChildren)
                cdeNMI.MyScreenManager.DeleteScreenByID(tIdx, bClearKids);
        }

        public AppendChild(pEle: INMIControl) {
            this.GetContainerElement().appendChild(pEle.GetElement());
        }

        public AppendContent(pEle: string) {
            this.GetContainerElement().innerHTML = pEle;
        }

        public CreateHTMLView(pHTML: string) {
            if (this.GetContainerElement())
                this.GetContainerElement().innerHTML = pHTML;
        }

        public CreateScriptInView(pScript: string) {
            if (!this.GetContainerElement()) return;
            const tScripEle: HTMLCollectionOf<HTMLScriptElement> = this.GetContainerElement().getElementsByTagName("script");
            if (tScripEle.length === 0) {
                if (this.mIsInitialized) return;
                this.GetContainerElement().innerHTML = "";
                const s: HTMLScriptElement = document.createElement('script');
                s.type = "text/javascript";
                s.text = pScript;
                this.GetContainerElement().appendChild(s);
            }
        }

        public CreateCSSInView(pStyle: string) {
            if (!this.GetContainerElement()) return;
            const tScripEle: HTMLCollectionOf<HTMLStyleElement> = this.GetContainerElement().getElementsByTagName("style");
            if (tScripEle.length > 0) {
                tScripEle[0].innerText = pStyle;
            } else {
                const s: HTMLStyleElement = document.createElement('style');
                s.type = "text/css";
                s.innerText = pStyle;
                this.GetContainerElement().insertBefore(s, this.GetContainerElement().firstChild);
            }
        }
        public UpdateCSSInView(pStyle: string) {
            if (!this.GetContainerElement()) return;
            const tScripEle: HTMLCollectionOf<HTMLStyleElement> = this.GetContainerElement().getElementsByTagName("style");
            if (tScripEle.length > 0) {
                tScripEle[0].innerText = pStyle;
            }
        }
        public RemoveCSSInView() {
            if (!this.GetContainerElement()) return;
            const tScripEle: HTMLCollectionOf<HTMLStyleElement> = this.GetContainerElement().getElementsByTagName("style");
            if (tScripEle.length > 0) {
                tScripEle[0].parentElement.removeChild(tScripEle[0]);
            }
        }

        public OnNUITag(pTag: string, pCookie: string) {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.TransitToScreen(this.MyScreenID);
        }

        //Backwards compat
        public static GetScreenByID(pScreenID: string): INMIScreen {
            if (cdeNMI.MyScreenManager)
                return cdeNMI.MyScreenManager.GetScreenByID(pScreenID);
            return null;
        }
    }
}