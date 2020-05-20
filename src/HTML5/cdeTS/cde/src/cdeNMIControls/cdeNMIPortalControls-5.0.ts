// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class ThePopup extends TheNMIBaseControl implements INMIPopUp {
        constructor(pTarget?: INMIControl) {
            super(pTarget, null);
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.Popup;
            const tButFlt = "margin:0 auto;";
            this.tileButOkButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=2", "ControlTH=1"], PostInitBag: ["Title=OK", "ClassName=cdeOkButton", "Style=" + tButFlt] });
            this.tileButOkButton.SetProperty("OnClick", () => this.DoOk());

            this.tileButYesButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=2", "ControlTH=1"], PostInitBag: ["Title=Yes", "ClassName=cdeYesButton", "Style=" + tButFlt] });
            this.tileButYesButton.SetProperty("OnClick", (sender, evt, pointer, cookie, parent) => this.DoYes(parent, cookie));

            this.tileButNoButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { PreInitBag: ["ControlTW=2", "ControlTH=1"], PostInitBag: ["Title=No", "ClassName=cdeNoButton", "Style=" + tButFlt] });
            this.tileButNoButton.SetProperty("OnClick", () => this.DoNo());

            this.gridPopups = document.getElementById("gridPopups") as HTMLDivElement;
            if (!this.gridPopups) {
                this.gridPopups = document.createElement("div");
                this.gridPopups.id = "gridPopups";
                this.gridPopups.className = "cdeScreenPopup";
                this.gridPopups.style.display = "none";
                this.gridPopups.style.height = "0px";
                this.gridPopups.innerHTML = "<div class=\"cdeCenteredPopup\" id=\"gridPopupsInner\"><div class=\"cdePopupContent41\" id=\"cdePopupQuestion\">" + cdeNMI.TL.T("Are you sure?") + "</div><table class=\"MyFullTable\"><tr><td id=\"popupButtonContainer\" class=\"cdeFlexRow\"></td></tr></table></div>";
                const tBody = document.getElementsByTagName("body");
                if (tBody)
                    tBody[0].appendChild(this.gridPopups);
                else
                    document.appendChild(document.createElement("body")).appendChild(this.gridPopups);
            }
            this.gridPopups.addEventListener("animationend", () => this.EndHide());

            this.gridPopupsInner = document.getElementById("gridPopupsInner") as HTMLDivElement;
            this.gridPopupsInner.style.width = cdeNMI.GetSizeFromTile(6) + "px";
            this.cdePopupQuestion = document.getElementById("cdePopupQuestion") as HTMLDivElement;
            this.elePopupButtonContent = document.getElementById("popupButtonContainer");

            this.SetElement(this.elePopupButtonContent);
            return true;
        }

        cdeEventYes;
        cdeEventNo;
        gridPopups: HTMLDivElement;
        gridPopupsInner: HTMLDivElement;
        cdePopupQuestion: HTMLDivElement;
        elePopupButtonContent: HTMLElement = null;

        tileButOkButton: cdeNMI.INMIControl = null;
        tileButYesButton: cdeNMI.INMIControl = null;
        tileButNoButton: cdeNMI.INMIControl = null;

        mTouchOverlay: cdeNMI.INMITouchOverlay = null;

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            if (pName === "YesLabel") {
                this.tileButYesButton.SetProperty("Text", pValue);
            }
            if (pName === "NoLabel") {
                this.tileButNoButton.SetProperty("Text", pValue);
            }
            if (pName === "OkLabel") {
                this.tileButOkButton.SetProperty("Text", pValue);
            }
        }

        public AddControl(pControl: INMIControl) {
            if (pControl)
                this.cdePopupQuestion.appendChild(pControl.GetElement());
        }

        DoYes(pParent, pCookie) {
            this.Hide(true);
            if (this.cdeEventYes) {
                this.cdeEventYes(this, pParent, pCookie);
            }
            this.cdeEventYes = null;
            this.cdeEventNo = null;
        }
        DoNo() {
            this.Hide(true);
            if (this.cdeEventNo) {
                this.cdeEventNo(this);
            }
            this.cdeEventYes = null;
            this.cdeEventNo = null;
        }

        DoOk() {
            this.Hide(true);
            if (this.cdeEventYes) {
                this.cdeEventYes(this);
            }
            this.cdeEventYes = null;
            this.cdeEventNo = null;
        }

        Hide(pPlayAni: boolean) {
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 2 && cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.ShowHeader(false);
            this.gridPopups.classList.remove("cde-animate-popup");
            if (pPlayAni)
                this.gridPopups.classList.add("cde-animate-fadeout");
            else
                this.EndHide();
        }

        EndHide() {
            if (this.gridPopups.classList.contains("cde-animate-popup") || !this.gridPopups.classList.contains("cde-animate-fadeout")) {
                return;
            }
            this.gridPopups.classList.remove("cde-animate-fadeout");
            this.gridPopups.style.display = 'none';
            if (cdeNMI.MyNMIPortal)
                cdeNMI.MyNMIPortal.DeleteControl(this.mTouchOverlay);
            this.mTouchOverlay = null;
        }

        public Show(pMessageText: string, bShowOkOnly?: boolean, pControl?: INMIControl, pBackColor?: number, sinkYes?, sinkNo?, pCookie?, pParent?): INMIPopUp {
            this.Hide(false);
            if (this.mTouchOverlay) {
                if (cdeNMI.MyNMIPortal)
                    cdeNMI.MyNMIPortal.DeleteControl(this.mTouchOverlay);
                this.mTouchOverlay = null;
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 2 && cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.ShowHeader(true);
            if (!this.gridPopups) return null;
            this.cdeEventYes = null;
            this.cdeEventNo = null;
            if (pMessageText !== '')
                this.cdePopupQuestion.innerHTML = cdeNMI.TL.T(pMessageText);
            this.elePopupButtonContent.innerHTML = "";
            if (!cdeNMI.MyNMIPortal) {
                cdeNMI.MyNMIPortal = cdeNMI.MyTCF.CreateBaseControl();
                cdeNMI.MyNMIPortal.SetElement(document.getElementById("MyNMIPortal"));
            }
            this.mTouchOverlay = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TouchOverlay).Create(cdeNMI.MyNMIPortal) as INMITouchOverlay;
            this.mTouchOverlay.SetProperty("Z-Index", 90);
            if (bShowOkOnly) {
                this.elePopupButtonContent.appendChild(this.tileButOkButton.GetElement());
                if (typeof sinkYes !== "undefined")
                    this.cdeEventYes = sinkYes;
            }
            else {
                if (pCookie) {
                    this.tileButYesButton.SetProperty("Cookie", pCookie);
                    this.tileButYesButton.SetProperty("Parent", pParent);
                }
                this.elePopupButtonContent.appendChild(this.tileButNoButton.GetElement());
                this.elePopupButtonContent.appendChild(this.tileButYesButton.GetElement());
                if (typeof sinkYes !== "undefined")
                    this.cdeEventYes = sinkYes;
                if (typeof sinkNo !== "undefined")
                    this.cdeEventNo = sinkNo;
            }
            this.SetProperty("YesLabel", "Yes");
            this.SetProperty("NoLabel", "No");
            this.SetProperty("OkLabel", "OK");
            switch (pBackColor) {
                case 1:
                    this.gridPopupsInner.className = "cdeCenteredPopup cdePopupBackAlarm";
                    break;
                default:
                    this.gridPopupsInner.className = "cdeCenteredPopup cdePopupBackInfo";
                    break;
            }
            this.AddControl(pControl);
            this.gridPopups.classList.add("cde-animate-popup");
            this.gridPopups.style.display = 'block';
            this.gridPopups.style.height = this.gridPopupsInner.clientHeight + "px";
            //this.gridPopups.style.height = "0px";
            // Velocity(document.querySelectorAll("#gridPopups"), { height: this.gridPopupsInner.clientHeight + "px" }, [1000, 20] );
            //$('#gridPopups').animate({ height: cdeNMI.ThePopup.ActivePopup.gridPopupsInner.clientHeight + "px" }, 1000, "easeOutBounce");
            return this;
        }

        //Backwards Compat
        public static Show(pMessageText: string, bShowOkOnly?: boolean, pControl?: INMIControl, pBackColor?: number, sinkYes?, sinkNo?, pCookie?, pParent?): INMIPopUp {
            if (cdeNMI.MyPopUp)
                return cdeNMI.MyPopUp.Show(pMessageText, bShowOkOnly, pControl, pBackColor, sinkYes, sinkNo, pCookie, pParent);
            return null;
        }
    }


    /**
 * Creates a Toast Control CANNOT BE USED IN FORMS
 *
 * (4.1 Ready!) Static control - CANNOT be Lazy Created!
 */
    export class TheToast extends TheNMIBaseControl implements INMIToast {
        /////***********************************************
        /////   Toast/Notification Functions
        /////***********************************************
        constructor(pTarget?: INMIControl) {
            super(pTarget, null);
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.Toast;
            this.mBaseCtrl = cdeNMI.MyTCF.CreateBaseControl();
            this.mRowElement = document.getElementById("cdeMessageToast") as HTMLDivElement;
            if (!this.mRowElement) {
                this.mRowElement = document.createElement("div");
                this.mRowElement.className = "cdeBrowserBottom";
                this.mRowElement.id = "cdeMessageToast";
                this.mRowElement.style.display = "none";
                this.mRowElement.style.width = "inherit";
                const tBody = document.getElementsByTagName("body");
                if (tBody)
                    tBody[0].appendChild(this.mRowElement);
                else
                    document.appendChild(document.createElement("body")).appendChild(this.mRowElement);
            }
            this.mBaseCtrl.SetElement(this.mRowElement);
            this.mBaseCtrl.SetProperty("Z-Index", 5000);
            this.mBaseCtrl.GetElement().addEventListener("animationend", () => this.EndHide());

            this.SetElement(this.mBaseCtrl.GetElement());

            this.mToastGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this);
            this.mToastGroup.SetProperty("ClassName", "cdeToast");
            this.mToastGroup.SetProperty("OnClick", () => {
                //$("#cdeMessageToast").stop()
                this.HideToast();
                this.IsAlert = false;
                this.mBaseCtrl.GetElement().style.display = 'none';
                this.SetProperty("Visibility", false);
            });
            this.mToastTopic = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.mToastGroup, { PreInitBag: ["Element=div"], PostInitBag: ["ClassName=cdeTextCrop ToastTopic"] }); //  ctrlSmartLabel.Create(this.mToastGroup, null, null, "", "div", false, "cdeTextCrop ToastTopic");
            this.mToastText = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.mToastGroup, { PreInitBag: ["Element=div"], PostInitBag: ["ClassName=cdeTextCrop ToastText"] }); // ctrlSmartLabel.Create(this.mToastGroup, null, null, "", "div", false, "cdeTextCrop ToastText");
            this.mToastDebug = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.mToastGroup, { PreInitBag: ["Element=div"], PostInitBag: ["ClassName=cdeTextCrop ToastDebug"] }); // ctrlSmartLabel.Create(this.mToastGroup, null, null, "", "div", false, "cdeTextCrop ToastDebug");
            this.SetProperty("Visibility", false);

            if (cdeNMI.MyEngine)
                cdeNMI.MyEngine.RegisterEvent("NMI_TOAST", this.ShowToastMessage);
            return true;
        }

        mToastTopic: INMIControl = null;
        mToastText: INMIControl = null;
        mToastDebug: INMIControl = null;
        mToastGroup: INMIControl = null;
        mBaseCtrl: INMIControl = null;
        IsAlert = false;
        mRowElement: HTMLDivElement = null;

        public SetProperty(pName: string, pValue) {
            if (!this.mToastGroup) return;
            if (pName !== "Visibility" && this.GetProperty("Visibility") !== true) return;
            super.SetProperty(pName, pValue);
            if (pName === "Text" || pName === "Value" || pName === "iValue")
                this.mToastTopic.SetProperty("Text", pValue);
            else if (pName === "LongText")
                this.mToastText.SetProperty("Value", pValue);
        }

        public ShowHideToast() {
            if (!this.mToastGroup) return;
            if (this.mBaseCtrl.GetElement().style.display === 'none') {
                this.mBaseCtrl.GetElement().style.display = '';
                this.mBaseCtrl.GetElement().style.height = this.mToastGroup.GetElement().style.height;
                this.SetProperty("Visibility", true);
            }
            else {
                this.mBaseCtrl.GetElement().style.display = 'none';
                this.mBaseCtrl.GetElement().style.height = '0px';
                this.ClearDebug();
                this.SetProperty("Visibility", false);
            }
        }

        public ShowToastMessage(pTopic: string, pText?: string, pTime?: number) {
            if (!this.mToastGroup) return;
            if (!this.IsAlert) {
                if (pTopic === "ALERT")
                    this.IsAlert = true;
                else
                    this.mToastTopic.SetProperty("Text", pTopic);
                if (pText)
                    this.mToastText.SetProperty("Text", pText);
                else
                    this.mToastText.SetProperty("Text", "");
                if (this.GetProperty("Visibility") !== true) {
                    this.SetProperty("Visibility", true);
                    this.mBaseCtrl.GetElement().classList.add("cde-animate-bottom");
                    this.mBaseCtrl.GetElement().style.display = '';
                    let tDura = 2000;
                    if (pTime && pTime > 500)
                        tDura = pTime;
                    setTimeout(
                        () => {
                            this.HideToast();
                        }, tDura);
                    if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.MyBaseAssets.MyCommStatus.UserPref.SpeakToasts)
                        cdeSpeech.talk(pTopic);
                }
            }
        }

        HideToast() {
            this.mBaseCtrl.GetElement().classList.remove("cde-animate-bottom");
            this.mBaseCtrl.GetElement().classList.add("cde-animate-fadeout");
        }

        EndHide() {
            if (this.mBaseCtrl.GetElement().classList.contains("cde-animate-bottom"))
                return;
            this.mBaseCtrl.GetElement().classList.remove("cde-animate-fadeout");
            this.mBaseCtrl.GetElement().style.display = 'none';
            this.SetProperty("Visibility", false);
            this.IsAlert = false;
        }

        public ShowDebug(pText: string) {
            if (this.mToastDebug)
                this.mToastDebug.SetProperty("Value", pText);
        }
        public ClearDebug() {
            if (this.mToastDebug)
                this.mToastDebug.SetProperty("Value", "");
        }
    }

    export class ctrlToolTip extends TheNMIBaseControl {
        constructor(pTarget?: INMIControl) {
            super(pTarget, null);
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.ToolTip;
            return true;
        }

        public Hide() {
            //override if necessary
        }

        public Show(pCtrlID: string, pToolTipText: string) {
            //override if necessary
        }
    }

    export class ctrlUserMenu extends TheNMIBaseControl {
        constructor(pTarget?: INMIControl) {
            super(pTarget, null);
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.UserMenu;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            let tF: number = cde.CInt(this.GetSetting("TileFactorY"));
            let iS = "5x";
            if (tF === 0)
                tF = 1;
            else
                iS = "3x";

            this.mOuterGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(pTargetControl, { PreInitBag: ["ControlTW=2", "ControlTH=1", "TileFactorX=" + tF, "TileFactorY=" + tF] }) as cdeNMI.INMIButton;

            if (cde.MyBaseAssets.MyServiceHostInfo.IsUserLoggedIn === true) {
                this.mAccountButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this.mOuterGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=" + tF, "TileFactorY=" + tF], PostInitBag: ["Title=<span class='fa fa-" + iS + "'>&#xf2bd;</span>", "ClassName=MyHeaderButton"] }) as cdeNMI.INMIButton;
                this.mAccountButton.SetProperty("OnClick", () => {
                    cdeNMI.MyScreenManager.TransitToScreen("E15AE1F2-69F3-42DC-97E8-B0CC2A8526A6", true);
                });
            }
            this.mLogoutButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this.mOuterGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorX=" + tF, "TileFactorY=" + tF], PostInitBag: ["Title=<span class='fa fa-" + iS + "'>&#xf011;</span>", "ClassName=MyHeaderButton"] }) as cdeNMI.INMIButton;
            this.mLogoutButton.SetProperty("OnClick", (pSender: INMIControl, evt: MouseEvent) => {
                if (evt.button === 2 && cde.MyBaseAssets.MyServiceHostInfo.WasPortalRequested === true) {
                    cdeNMI.MyScreenManager.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
                }
                else
                    cdeNMI.ResetBrowserToPortal();
            });

            this.SetElement(this.mOuterGroup.GetElement());
            return true;
        }

        mOuterGroup: INMIControl;
        mAccountButton: INMIButton;
        mLogoutButton: INMIButton;
    }
}