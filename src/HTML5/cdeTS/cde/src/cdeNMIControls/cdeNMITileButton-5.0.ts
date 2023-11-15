// SPDX-FileCopyrightText: 2009-2023 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    /**
* Creates a Tiled Button 
*
* (4.1 Ready!)
*/
    export class ctrlTileButton extends TheNMIBaseControl implements INMIButton {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        private s2: HTMLElement = null;
        private divTitle: HTMLDivElement = null;
        private divOuter: HTMLDivElement = null;
        private divInner: HTMLDivElement = null;
        private divControl: HTMLDivElement = null;
        private IsDIV = false;
        private mFormat: string = null;
        private IsTesla = false;
        private IsCustomTile = false;
        private mHoverAdd = "cdeButtonHover2";

        static Create(pTarget: INMIControl, pOnClick, pTitle: string, pTileX?: number, pTileY?: number, pClass?: string, pStyleInsert?: string, pCookie?, pParent?, pAllowMT?: boolean): ctrlTileButton {
            const tTile: ctrlTileButton = new ctrlTileButton();
            if (pTileX)
                tTile.SetProperty("ControlTW", pTileX);
            if (pTileY)
                tTile.SetProperty("ControlTH", pTileY);

            tTile.InitControl(pTarget);

            if (pTitle) {
                tTile.SetProperty("Title", pTitle);
            }

            if (pCookie)
                tTile.SetProperty("Cookie", pCookie);
            if (pParent)
                tTile.SetProperty("Parent", pParent);
            if (pClass)
                tTile.SetProperty("ClassName", pClass);
            if (pStyleInsert)
                tTile.SetProperty("Style", pStyleInsert);
            if (pOnClick)
                tTile.SetProperty("OnClick", pOnClick);
            if (pAllowMT)
                tTile.SetProperty("PreventDefault", pAllowMT);

            return tTile;
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.TileButton;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.IsTesla = (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 5);
            if (this.IsTesla)
                this.mHoverAdd = "cdeTesButton";
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 1)
                this.mHoverAdd = null;

            if (cde.CBool(this.GetSetting("IsCustomTile")) === true) {
                this.IsCustomTile = true;
                this.s2 = document.createElement('div');
                this.SetElement(this.s2, false);
                this.MyContainerElement = this.s2;
                this.SetInitialSize();
            }
            else {
                this.s2 = document.createElement('button');
                (this.s2 as HTMLButtonElement).type = "button";

                this.SetProperty("ButtonStyle", 0); //custom
                this.SetTileStyle();

                this.RegisterEvent("PointerDown", (pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) => this.eventTileDown(pTarget, pEvent, pPointer));
                this.RegisterEvent("PointerUp", (pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) => this.eventTileExit(pTarget, pEvent, pPointer));
                this.SetElement(this.s2, false);

                this.SetProperty("Disabled", (this.MyFieldInfo && (typeof this.MyFieldInfo.Flags !== "undefined") && (this.MyFieldInfo.Flags & 2) === 0)); //Must allow Click if MyFieldInfo is not set

                this.CreateTileButtonContent();

                this.MyContainerElement = this.divInner;
            }
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "TileWidth") pName = "ControlTW";
            if (pName === "TileHeight") pName = "ControlTH";
            super.SetProperty(pName, pValue);
            if (pName === "HTML") {
                cdeNMI.cdeParseHTML(this, this.MyTRF, pValue);
            } else if (pName === "StaticHTMLUrl") {
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.cdeGetResource(pValue, (cookie, data: string) => {
                        if (data && !data.startsWith("ERR:")) {
                            while (true) {
                                const tSeg = cdeNMI.ReturnStringSegment(data, "<%P:", "%>");
                                if (tSeg === null) break;
                                const tTCB: cdeNMI.TheControlBlock = new cdeNMI.TheControlBlock();
                                tTCB.TargetID = "CNMIC" + (cdeNMI.MyNMISettings.IDCounter++);
                                this.SetProperty(tSeg.Inner + "_TCB", tTCB);
                                let tP = this.GetProperty(tSeg.Inner);
                                if (!tP)
                                    tP = "";
                                data = data.replace(tSeg.Outer, "<span ID=" + tTCB.TargetID + ">" + tP + "</span>");
                            }
                            this.GetContainerElement().innerHTML = cdeNMI.GenerateFinalString(data, false, this.MyTRF);
                        }
                    });
                }
            } else if (pName === "HTMLUrl") {
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.cdeGetResource(pValue, (cookie, data: string) => {
                        if (data && !data.startsWith("ERR:"))
                            cdeNMI.cdeParseHTML(this, this.MyTRF, data);
                    });
                }
            } else if (pName === "Background") {
                if (this.s2)
                    this.s2.style.backgroundColor = pValue;
            } else if (pName === "BackgroundImage") {
                if (this.s2)
                    this.s2.style.backgroundImage = pValue;
            } else if (pName === "Foreground") {
                if (this.divTitle)
                    this.divTitle.style.color = pValue;
            } else if (pName === "IsHitTestDisabled" && this.divOuter) {
                if (cde.CBool(pValue))
                    this.divOuter.style.pointerEvents = 'none';
                else
                    this.divOuter.style.pointerEvents = '';
            } else if (pName === "FontSize") {
                if (this.divTitle)
                    this.divTitle.style.fontSize = pValue + "px";
            } else if (pName === "TabIndex") {
                if (this.s2) {
                    pValue = cde.CInt(pValue);
                    this.s2.tabIndex = cde.CInt(pValue);
                }
            } else if (pName === "Format") {
                let UpdateTitle = false;
                if (!this.mFormat)
                    UpdateTitle = true;
                this.mFormat = pValue;
                if (UpdateTitle) {
                    this.SetProperty("RTitle", this.divTitle.innerHTML);
                    this.SetTileTitle("Text", this.divTitle.innerHTML);
                }
            } else if ((pName === "Title" || pName === "Caption" || pName === "Text" || pName === "Value" || pName === "iValue") && pValue) {
                this.SetProperty("RTitle", pValue);
                this.SetTileTitle(pName, pValue);
            } else if (pName === "OnPointerDown" && this.s2) {
                if (pValue) {
                    this.PreventManipulation = true;
                    this.HookEvents(false);
                    this.RegisterEvent("PointerDown", pValue);
                }
            } else if (pName === "OnClick" && this.s2) {
                if (pValue) {
                    this.PreventManipulation = true;
                    this.HookEvents(false);
                    this.SetHoverStyle(cde.CBool(this.GetProperty("Disabled")));
                    this.RegisterEvent("FireOnClick", this.FireClick);

                    this.RegisterEvent("OnClick", pValue);
                    this.s2.onkeyup = (evt) => {
                        if (evt.keyCode === 13 || evt.keyCode === 32) {
                            this.WasClicked = false;
                            this.FireClick(this, evt);
                        } else if (evt.keyCode === 36 && cdeNMI.MyScreenManager) {
                            cdeNMI.MyScreenManager.GotoStationHome(false);
                        }
                    }
                }
            }
            else if (pName === "OnTileDown") {
                this.RegisterEvent("OnTileDown", pValue);
                if (pValue) {
                    this.PreventManipulation = true;
                    this.HookEvents(false);
                }
            }
            else if (pName === "EnableTap") {
                this.PreventManipulation = true;
                this.HookEvents(false);
                this.SetHoverStyle(cde.CBool(this.GetProperty("Disabled")), true);
            }
            else if ((pName === "Disabled" || pName === "DisableClick") && this.s2) {
                this.SetHoverStyle(cde.CBool(pValue));
                if (!this.IsDIV && !this.IsCustomTile) {
                    try {
                        (this.s2 as HTMLButtonElement).disabled = cde.CBool(pValue);
                        if (cde.CBool(pValue))
                            this.s2.style.outlineStyle = "none";
                    }
                    catch { }
                }
                if (pName === "Disabled") {
                    if (this.MyNMIControl)
                        this.MyNMIControl.SetProperty(pName, pValue);
                }
            } else if (this.MyNMIControl && pName.substring(0, 1) === ".") {
                if (this.MyNMIControl)
                    this.MyNMIControl.SetProperty(pName.substring(1), pValue);
            } else if (pName === "ControlTW" || pName === "TileFactorX" || pName === "ControlTH" || pName === "TileFactorY") {
                this.SetTileStyle();
                this.SetSizes();
            } else if ((pName === "ClassName")) {
                if ((cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 1) && pValue) {
                    let tHovClass: string = this.GetProperty("HoverClassName");
                    if (!tHovClass)
                        tHovClass = "cdeButtonHover2";
                    if (tHovClass && this.s2.classList.contains(tHovClass))
                        this.s2.classList.remove(tHovClass);
                }
                this.SetSizes();
            } else if (pName === "InnerControl" && pValue) {
                this.SetInnerControl(pValue);
            } else if (pName === "SubTitle" && pValue) {
                this.SetTileTitle("Title", this.GetProperty("RTitle"));
            } else if (pName.toLowerCase() === "thumbnail") {
                const tParts: string[] = pValue.split(';');
                if (tParts[0].startsWith("FA")) {
                    this.SetTileTitle("Title", this.GetProperty("RTitle"));
                }
                else {
                    const tInsideCtrl: INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.Picture).Create(null, { PostInitBag: ["iValue=" + tParts[0], "FullWidth=-1", "FullHeight=-1"] });
                    if (tParts.length > 1) {
                        tInsideCtrl.SetProperty("Opacity", tParts[1]);
                        if (tParts.length > 2)
                            tInsideCtrl.SetProperty("ClassName", tParts[2]);
                    }
                    else
                        tInsideCtrl.SetProperty("Opacity", 0.2);
                    this.SetInnerControl(tInsideCtrl);
                }
            }
        }

        SetHoverStyle(bIsDisabled: boolean, bAddForce?: boolean) {
            if (!this.s2 || !this.mHoverAdd)
                return;
            if (bIsDisabled) {
                if (this.s2.classList.contains(this.mHoverAdd))
                    this.s2.classList.remove(this.mHoverAdd);
                this.SetProperty("TabIndex", -1);
            }
            else {
                if (super.GetProperty("OnClick") || bAddForce === true) {
                    if (!this.s2.classList.contains(this.mHoverAdd))
                        this.s2.classList.add(this.mHoverAdd);
                }
                else {
                    if (this.s2.classList.contains(this.mHoverAdd))
                        this.s2.classList.remove(this.mHoverAdd);
                }
            }
        }

        SetTileStyle() {
            const pTileX: number = cde.CInt(this.GetProperty("ControlTW"));
            const pTileY: number = cde.CInt(this.GetProperty("ControlTH"));
            if (pTileX < 2) {
                if (!this.GetProperty("ClassName") && this.s2)
                    this.s2.className = "cdeLiveTileSmall";
                this.SetProperty("ButtonStyle", 1); //small
            }
            else {
                if (pTileY < pTileX) {
                    if (pTileX > 6) {
                        if (!this.GetProperty("ClassName") && this.s2)
                            this.s2.className = "cdeLiveTileVeryLong";
                        this.SetProperty("ButtonStyle", 4); //Normal
                    }
                    else {
                        if (!this.GetProperty("ClassName") && this.s2)
                            this.s2.className = "cdeLiveTileLong";
                        this.SetProperty("ButtonStyle", 3); //Normal
                    }
                }
                else {
                    if (!this.GetProperty("ClassName") && this.s2)
                        this.s2.className = "cdeLiveTile";
                    this.SetProperty("ButtonStyle", 2); //Normal
                }
            }
            this.SetHoverStyle(cde.CBool(this.GetProperty("Disabled")));
        }

        private SetTileTitle(pName: string, pValue: string) {
            if (this.mFormat)
                pValue = this.mFormat.format(pValue);
            if (!this.MyNMIControl || this.MyNMIControl.MyBaseType === cdeControlType.Picture || pName === "Title" || pName === "Text") {
                const tS: string = this.GetProperty("Thumbnail");
                if (this.divTitle && (pValue || tS)) {
                    if (pValue)
                        pValue = cdeNMI.IconShim(pValue);
                    if (tS && tS.startsWith("FA")) {
                        pValue = "<i class='fa" + (tS.substr(3, 1) === "B" ? "b": "") + " faIcon " + (tS.substr(3, 1) === "S" ? "fa-spin " : "") + "fa-" + tS.substr(2, 1) + "x'>&#x" + tS.substr(4, tS.length - 4) + ";</i></br>" + (pValue ? pValue : "");
                    }
                    const tSubT = this.GetProperty("SubTitle");
                    if (tSubT)
                        pValue += "</br><span style='font-size:10px'>" + tSubT + "</span>";
                    this.divTitle.innerHTML = ((pName === "Text" || pName === "Title") ? cdeNMI.TL.T(pValue) : cdeNMI.IconFAShim(pValue));
                    this.divInner.style.display = '';
                }
            }
            else {
                if (cde.CInt(this.MyNMIControl.MyBaseType) !== cde.CInt(cdeControlType.Picture)) ///BUG IN TS 2.1: should works 
                    this.MyNMIControl.SetProperty(pName, pValue);
            }
        }

        private CreateTileButtonContent() {
            if (!this.s2) return;
            this.s2.innerHTML = "";

            this.SetTileStyle();

            this.divOuter = document.createElement("div");
            this.divOuter.style.overflow = "hidden";
            this.divOuter.style.pointerEvents = "none";
            this.divOuter.style.position = "relative";

            this.divInner = document.createElement("div");

            this.divTitle = document.createElement("div");
            if (this.GetProperty("Value"))
                this.divTitle.innerHTML = this.GetProperty("Value");
            else if (this.GetProperty("Title"))
                this.divTitle.innerHTML = this.GetProperty("Title");

            this.divInner.appendChild(this.divTitle);
            this.divOuter.appendChild(this.divInner);

            this.SetSizes();

            this.s2.appendChild(this.divOuter);
        }

        SetSizes() {
            this.SetInitialSize();
            if (!this.divOuter) return;

            this.divOuter.style.width = "inherit";
            this.divOuter.style.height = "inherit";
            this.divInner.style.width = "inherit";
            this.divInner.style.zIndex = "10";
            this.divOuter.className = "cdeFlexRow cdeFlexCenter";
            this.divInner.className = "cdeFlexO0";

            if (this.GetProperty("ClassName"))
                this.s2.className = this.GetProperty("ClassName");

            if (this.divTitle) {
                if (this.GetProperty("ClassName")) {
                    const tCls: string[] = this.GetProperty("ClassName").split(' ');
                    let tFinCls = "";
                    for (const element of tCls) {
                        tFinCls += element + "inner ";
                    }
                    this.divTitle.className = tFinCls;
                }
                else {
                    if (this.GetProperty("ButtonStyle") === "2") {
                        this.SetButtonStyle2();
                    }
                    else {
                        if (this.GetProperty("ButtonStyle") === "1")
                            this.divTitle.className = "cdeTileTextSmall";
                        else
                            this.divTitle.className = "cdeTileTextNoImg";
                    }
                }
            }
            this.SetHoverStyle(cde.CBool(this.GetProperty("Disabled")));
        }

        SetButtonStyle2() {
            this.divTitle.className = "cdeTileText";
            this.divInner.className = "cdeFlexO2";
            this.divOuter.className = "cdeFlexRow cdeFlexCenter cdeFlexStart";
        }

        public SetInnerControl(pControl: INMIControl) {
            if (this.divTitle && pControl) {
                this.MyNMIControl = pControl;
                this.divControl = document.createElement("div");
                this.divControl.className = "cdeFlexRow cdeFlexCenter";
                this.divControl.style.width = "inherit";
                this.divControl.style.position = "absolute";
                this.divControl.style.left = "0";
                this.divControl.style.top = "0";
                if (this.divTitle.innerHTML !== "") {
                    this.divInner.style.alignSelf = "flex-end";
                    this.divInner.style.marginBottom = "5px";
                }
                this.divControl.appendChild(this.MyNMIControl.GetElement());
                this.divOuter.appendChild(this.divControl);
            }
        }


        ///EVENTS /////

        eventHoverIn(eventObject) {
            this.ShowHoverIn(eventObject.target);
        }

        ShowHoverIn(eventObject: HTMLElement) {
            if (!(eventObject instanceof HTMLButtonElement))
                return;
            let tHovClass: string = this.GetProperty("HoverClassName");
            if (!tHovClass)
                tHovClass = this.mHoverAdd;
            if (tHovClass)
                eventObject.classList.add(tHovClass);
        }
        eventHoverOut(eventObject) {
            this.ShowHoverOut(eventObject.target);
        }

        ShowHoverOut(eventObject: HTMLElement) {
            if (!(eventObject instanceof HTMLButtonElement))
                return;
            let tHovClass: string = this.GetProperty("HoverClassName");
            if (!tHovClass)
                tHovClass = this.mHoverAdd;
            if (tHovClass && eventObject.classList.contains(tHovClass))
                eventObject.classList.remove(tHovClass);
        }

        eventTileDown(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            if (!this.GetProperty("Disabled")) {
                if (TheNMIScreen.GetScreenByID(this.MyFormID)?.AllowDragging === true)
                    return;
                if (pPointer.IsOnObject || cde.CBool(this.GetProperty("IgnoreHitTarget"))) {
                    this.WasClicked = false;
                    this.SetProperty("IsDown", true);
                    this.ShowHoverIn(this.s2);
                    this.FireEvent(true, "OnTileDown", pEvent, pPointer);
                }
            }
        }

        eventTileExit(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            if (!this.GetProperty("Disabled")) {
                if (TheNMIScreen.GetScreenByID(this.MyFormID)?.AllowDragging === true)
                    return;
                this.SetProperty("IsDown", false);
                this.ShowHoverOut(this.s2);
                if ((pPointer.IsOnObject || cde.CBool(this.GetProperty("IgnoreHitTarget"))) && pPointer.PathLength() < cdeNMI.MyNMISettings.DeadPathLength) {
                    this.FireClick(this, pEvent);
                }
            }
        }

        public FireClick(pSender: INMIControl, pEvent?: Event) {
            if (TheNMIScreen.GetScreenByID(this.MyFormID)?.AllowDragging === true)
                return;
            if (this.HasEvent("OnClick") && !this.WasClicked) {
                if (this.GetProperty("AreYouSure")) {
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Show(this.GetProperty("AreYouSure"), false, null, 1, () => {
                            if (pEvent)
                                (pEvent as any).AYSFired = true;
                            this.DoFireClick(this, pEvent);
                        });
                }
                else
                    this.DoFireClick(this, pEvent);
            }
        }

        public OnNUITag(pTag: string, pCookie: string) {
            this.WasClicked = false;
            this.FireClick(null);
        }
    }

    export class ctrlLogoButton extends ctrlTileButton {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        tLogoGroup: INMIControl;
        MyLogoParts: INMIControl[] = Array<INMIControl>();

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.LogoButton;

            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.tLogoGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(null);
            this.tLogoGroup.SetProperty("IsDivOnly", true);
            let tF: number = cde.CInt(this.GetSetting("TileFactorY"));
            if (tF < 1) tF = 1;
            let tS: number = cde.CInt(this.GetSetting("TileHeight"));
            if (tS < 1)
                tS = 1;
            this.tLogoGroup.SetProperty("Style", "font-size:" + (cdeNMI.GetSizeFromTile(tS) / tF) + "px");

            this.MyLogoParts[0] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-B cdeButtonHover2"] });
            this.MyLogoParts[0].SetProperty("Foreground", "#1DA3D1");
            this.MyLogoParts[1] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-C cdeButtonHover2"] });
            this.MyLogoParts[1].SetProperty("Foreground", "#1DA3D1");
            this.MyLogoParts[2] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-D cdeButtonHover2"] });
            this.MyLogoParts[2].SetProperty("Foreground", "#1DA3D1");

            this.MyLogoParts[3] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-E cdeButtonHover2"] });
            this.MyLogoParts[3].SetProperty("Foreground", "#CCCCCC");
            this.MyLogoParts[4] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-F cdeButtonHover2"] });
            this.MyLogoParts[4].SetProperty("Foreground", "#52D0EB");
            this.MyLogoParts[5] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-G cdeButtonHover2"] });
            this.MyLogoParts[5].SetProperty("Foreground", "#CCCCCC");

            this.MyLogoParts[6] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-H cdeButtonHover2"] });
            this.MyLogoParts[6].SetProperty("Foreground", "#52D0EB");
            this.MyLogoParts[7] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-I cdeButtonHover2"] });
            this.MyLogoParts[7].SetProperty("Foreground", "#52D0EB");
            this.MyLogoParts[8] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-J cdeButtonHover2"] });
            this.MyLogoParts[8].SetProperty("Foreground", "#CCCCCC");


            this.MyLogoParts[9] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.tLogoGroup, { PreInitBag: ["Element=span"], PostInitBag: ["ClassName=cl cl-K cdeButtonHover2"] });
            this.MyLogoParts[9].SetProperty("Foreground", "#1DA3D1");
            this.SetProperty("InnerControl", this.tLogoGroup);

            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "Value" || pName === "iValue") {
                //Dont set any value!!
                return;
            } else if (pName === "FontSize") {
                this.tLogoGroup.SetProperty("Style", "font-size:" + cde.CInt(pValue) + "px");
            } else if (pName === "Relay") {
                this.MyLogoParts[9].SetProperty("Foreground", this.GetState(cde.CInt(pValue)));
            } else if (pName === "LogoState") {
                for (let i = 0; i < 10; i++)
                    this.MyLogoParts[i].SetProperty("Foreground", this.GetState(cde.CInt(pValue)));
            } else if (pName === "LogoColor") {
                for (let i = 0; i < 10; i++)
                    this.MyLogoParts[i].SetProperty("Foreground", pValue);
            } else if (pName === "Reset") {
                this.MyLogoParts[0].SetProperty("Foreground", "#1DA3D1");
                this.MyLogoParts[1].SetProperty("Foreground", "#1DA3D1");
                this.MyLogoParts[2].SetProperty("Foreground", "#1DA3D1");
                this.MyLogoParts[3].SetProperty("Foreground", "#CCCCCC");
                this.MyLogoParts[4].SetProperty("Foreground", "#52D0EB");
                this.MyLogoParts[5].SetProperty("Foreground", "#CCCCCC");
                this.MyLogoParts[6].SetProperty("Foreground", "#52D0EB");
                this.MyLogoParts[7].SetProperty("Foreground", "#52D0EB");
                this.MyLogoParts[8].SetProperty("Foreground", "#CCCCCC");
                this.MyLogoParts[9].SetProperty("Foreground", "#1DA3D1");
            }
            super.SetProperty(pName, pValue);
        }


        ///"gray;green;yellow;red;blue;brown;purple;black";
        GetState(pStatusLevel: number): string {
            switch (pStatusLevel) {
                case 1: return "green";
                case 2: return "yellow";
                case 3: return "red";
                case 4: return "blue";
                case 5: return "brown";
                case 6: return "purple";
                case 7: return "black";
            }
            return "#ccc";
        }
    }
}