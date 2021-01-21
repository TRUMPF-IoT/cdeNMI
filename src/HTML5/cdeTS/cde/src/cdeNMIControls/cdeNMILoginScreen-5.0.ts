// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    /**
* Creates a new Login Screen Control
*
* (4.1 Ready!)
*/
    export class TheLoginScreen extends TheNMIScreen implements INMILoginScreen {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        mUID: cdeNMI.INMITileEntry = null;
        mPWD: cdeNMI.INMITileEntry = null;
        mPWD2: cdeNMI.INMITileEntry = null;
        mRelay: cdeNMI.INMITileEntry = null;
        mScope: cdeNMI.INMITileEntry = null;
        mLoginButton: cdeNMI.INMITileEntry = null;
        mHeader: cdeNMI.INMITileEntry = null;
        mHeaderHelp: cdeNMI.INMITileEntry = null;
        mStatusMsg: cdeNMI.INMITileEntry = null;
        tLoginGroup: cdeNMI.INMITileEntry = null;
        mMeshPicker: cdeNMI.INMIControl = null;
        bFinishCalled = false;
        bLoginFired = false;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.LoginScreen;
            if (!pPropertyBag) pPropertyBag = [];
            pPropertyBag.push("HidePins=true");
            pPropertyBag.push("ScreenTitle=Login Screen");
            pPropertyBag.push("DashBoardID=LOGIN");
            super.InitControl(pTargetControl, pTRF, pPropertyBag, "CDELOGINSCREEN");
            this.SetProperty("ScreenClassName", "cde-animate-login cdeLoginScreen");
            this.SetProperty("ClassName", "cdeLoginContent");

            this.tLoginGroup = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(this, { PostInitBag: ["TileWidth=6", "ClassName=cdeLoginBlock"] }) as INMITileEntry;

            const tIcon: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.LogoButton, 4, "", 0, "", ["TileWidth=2", "TileHeight=2", "ClassName=cdeLogo cdeLoginItemAnim", "Style=outline-style:none;"]));
            const tIconTE: cdeNMI.INMITileEntry = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tIcon }) as INMITileEntry;
            tIconTE.CreateControl("LOGO");
            tIconTE.SetProperty("OnClick", () => {
                if (cde.MyBaseAssets.MyServiceHostInfo.PortalReset)
                    cde.MyBaseAssets.MyServiceHostInfo.PortalReset();
                else {
                    location.reload(true);
                    //cdeNMI.ResetBrowserToPortal();
                }
            });


            const tHeader: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.SmartLabel, 4, "", 2, "", ["NoTE=true", "TileFactorY=2", "TileHeight=1", "TileWidth=4", "ClassName=cdeDlgTitleBar", "ContainerStyle=margin-top: 34px;", "iValue=Welcome to your NMI Portal"]));
            this.mHeader = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tHeader }) as INMITileEntry;
            this.mHeader.CreateControl("HEADER");

            let tLogText = "Please login with your credentials";
            if (cde.MyBaseAssets.MyServiceHostInfo.LoginDisallowed) {
                if (this.GetProperty("ReasonText"))
                    tLogText = this.GetProperty("ReasonText");
                else
                    tLogText = "This Node is locked. NMI Access is disallowed";
            } else if (cde.MyBaseAssets.HasAutoLogin === true)
                tLogText = "Autologin...please wait";
            const tHeader2: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.SmartLabel, 4, "", 258, "", ["NoTE=true", "TileHeight=1", "TileWidth=4", "iValue=" + tLogText]));
            this.mHeaderHelp = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tHeader2 }) as INMITileEntry;
            this.mHeaderHelp.CreateControl("HEADERHELP");

            let tStatus = "Waiting...";
            let tStatusClass = "cdeEngineStatusYellow";
            if (!cde.MyBaseAssets.MyServiceHostInfo.LoginDisallowed) {
                if (!cde.MyBaseAssets.MyServiceHostInfo.AutoConnectRelay || cde.MyBaseAssets.MyServiceHostInfo.AutoConnectRelay === "") {
                    const tRelays: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.ComboOption, 4, "Select Relay", 2, "", ["EditPlaceholder=Select or enter a relay", "Options=" + cde.MyBaseAssets.MyServiceHostInfo.KnownRelays]));
                    this.mRelay = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tRelays }) as INMITileEntry;
                    this.mRelay.CreateControl("UID");
                }

                if (cde.MyBaseAssets.HasAutoLogin === false) {

                    if (cde.MyBaseAssets.MyServiceHostInfo.EnablePinLogin) {
                        const tPWD: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.Password, 4, "PIN", 3, "", ["EditPlaceholder=Enter Pin", "InTemplate=true", "AutoShowMTL=true"]));
                        this.mPWD = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tPWD }) as INMITileEntry;
                        this.mPWD.CreateControl("PWD");
                        this.mPWD.MyNMIControl.RegisterEvent("OnValueChanged", () => {
                            this.LoginClick();
                        });
                    }
                    else {
                        const tUID: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.eMail, 4, "Username", 2, "", ["EditPlaceholder=Enter email", "InTemplate=true"]));
                        this.mUID = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tUID }) as INMITileEntry;
                        this.mUID.CreateControl("UID");

                        const tPWD: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.Password, 4, "Password", 3, "", ["EditPlaceholder=Enter Password", "InTemplate=true"]));
                        this.mPWD = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tPWD }) as INMITileEntry;
                        this.mPWD.CreateControl("PWD");

                        if (cde.MyBaseAssets.MyServiceHostInfo.AdminPWMustBeSet) {
                            const tPWD2: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.Password, 4, "Repeat Password", 3, "", ["EditPlaceholder=Repeat Password", "InTemplate=true"]));
                            this.mPWD2 = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tPWD2 }) as INMITileEntry;
                            this.mPWD2.CreateControl("PWD2");

                            if (cde.MyBaseAssets.MyServiceHostInfo.AllowSetScopeWithSetAdmin) {
                                const tScope: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.Password, 4, "Security ID", 3, "", ["EditPlaceholder=Security ID", "Visibility=false", "InTemplate=true"]));
                                this.mScope = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tScope }) as INMITileEntry;
                                this.mScope.CreateControl("SCOPE");
                            }
                        }

                        const tLogBut: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.TileButton, 4, "Login", 2, "", ["NoTE=true"]));
                        this.mLoginButton = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tLogBut }) as INMITileEntry;
                        this.mLoginButton.CreateControl("LOGBUT");
                        this.mLoginButton.MyNMIControl.SetProperty("OnClick", () => { this.LoginClick(); })
                        this.mPWD.MyNMIControl.RegisterEvent("OnReturn", () => { this.LoginClick(); });
                    }
                }
            }
            else {
                if (this.GetProperty("StatusText"))
                    tStatus = this.GetProperty("StatusText");
                else
                    tStatus = "Node locked!";
                tStatusClass = "cdeEngineStatusRed";
            }

            const tStatMsg: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.SmartLabel, 4, "Status...", 2, "", ["NoTE=true", "TileFactorY=2", "TileHeight=1", "TileWidth=6", "ClassName=" + tStatusClass, "iValue=" + tStatus]));
            this.mStatusMsg = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(this.tLoginGroup, { TRF: tStatMsg }) as INMITileEntry;
            this.mStatusMsg.CreateControl("LOGSTATUS");

            if (cdeNMI.MyEngine && !cde.MyBaseAssets.MyServiceHostInfo.LoginDisallowed) {
                cdeNMI.MyEngine.RegisterEvent("CDE_LOGIN_EVENT", (s, a, r, b) => { this.FinishLogin(a, r, b); });
                cdeNMI.MyEngine.RegisterEvent("CDE_SETSTATUSMSG", (s, a, b) => { this.SetStatusMsg(a, b); });
                cdeNMI.MyEngine.RegisterEvent("CDE_SELECT_MESH", (s, a) => { this.ShowMeshSelect(a); });
                cdeNMI.MyEngine.RequestEngineStatus();
            }
            //this.SetElement(this.tLoginGroup.GetElement(), true, this.tLoginGroup.GetElement());
            this.ResetDialog();
            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            if (pName === "Text" || pName === "Value" || pName === "iValue") {
                this.mHeaderHelp.SetProperty("Text", pValue);
            } else if (pName === "Visibility") {
                if (cde.CBool(pValue)) {
                    if (cdeNMI.MyScreenManager)
                        cdeNMI.MyScreenManager.ShowHeader(false);
                }
                else {
                    if (cdeNMI.MyScreenManager)
                        cdeNMI.MyScreenManager.ShowHeader(true);
                }
            }
        }

        LoginClick() {
            if (cde.MyBaseAssets.MyServiceHostInfo.AdminPWMustBeSet) {
                if (cdeNMI.Check4ValidPassword(this.mPWD.MyNMIControl.GetProperty("Value"))) {
                    if (cdeNMI.IsSamePassword(this.mPWD.MyNMIControl.GetProperty("Value"), this.mPWD2.MyNMIControl.GetProperty("Value"), true)) {
                        if (cdeNMI.Check4ValidEmail(this.mUID.MyNMIControl.GetProperty("Value"))) {
                            cdeNMI.Key13Event = null;
                            this.SetProperty("Text", "...updating Admin credentials...");
                            this.mUID.MyNMIControl.SetProperty("Disabled", true);
                            this.mPWD.MyNMIControl.SetProperty("Disabled", true);
                            this.mPWD2.MyNMIControl.SetProperty("Disabled", true);
                            if (this.mScope)
                                this.mScope.MyNMIControl.SetProperty("Disabled", true);
                            this.mLoginButton.MyNMIControl.SetProperty("Disabled", true);
                            let toEncr = this.mUID.GetProperty("Value") + ";:;" + this.mPWD.GetProperty("Value");
                            if (this.mScope && cde.MyBaseAssets.MyServiceHostInfo.AllowSetScopeWithSetAdmin)
                                toEncr += ";:;" + this.mScope.GetProperty("Value");
                            let cred = toEncr;
                            if (cde.MyContentEngine) {
                                cred = cde.MyContentEngine.RSAEncrypt(cred);
                                cde.MyContentEngine.PublishToFirstNode('CDE_UPD_ADMIN:' + cde.MyBaseAssets.MyServiceHostInfo.AdminRole, cred);
                            }
                        }
                        else {
                            this.ShakeNError("Please enter a valid email address.");
                        }
                    }
                    else {
                        this.ShakeNError("Admin Passwords do not match, please try again");
                    }
                }
                else {
                    this.ShakeNError("Passwords must be at least 8 characters, please try again");
                }
            }
            else {
                let tTarget: string = null;
                if (!cde.MyBaseAssets.MyServiceHostInfo.AutoConnectRelay) {
                    tTarget = this.mRelay.GetProperty("Value");
                    this.mRelay.SetProperty("Disabled", true);
                }
                if (!cde.MyBaseAssets.MyServiceHostInfo.IsUsingUserMapper || cde.MyBaseAssets.MyServiceHostInfo.EnablePinLogin) {
                    cdeNMI.Key13Event = null;
                    if (cde.MyBaseAssets.MyServiceHostInfo.EnablePinLogin === true)
                        this.SetProperty("Text", "...login with PIN...");
                    else
                        this.SetProperty("Text", "...setting scope...");
                    const tScope = this.mPWD.GetProperty("Value");
                    if (this.mUID)
                        this.mUID.SetProperty("Disabled", true);
                    this.mPWD.SetProperty("Disabled", true);
                    if (this.mPWD2)
                        this.mPWD2.SetProperty("Disabled", true);
                    if (this.mLoginButton)
                        this.mLoginButton.SetProperty("Disabled", true);
                    if (cdeNMI.MyEngine)
                        cdeNMI.MyEngine.Login(tTarget, tScope);
                    else {
                        if (this.HasEvent("OnLogin"))
                            this.FireEvent(true, "OnLogin", tScope);
                        else {
                            if (cdeNMI.MyPopUp)
                                cdeNMI.MyPopUp.Show("NMI requires login but no login provider found. Access is denied.", true, null, null, () => {
                                    cdeNMI.ResetBrowserToPortal();
                                });
                        }
                    }
                } else {
                    if (cdeNMI.MyEngine) {
                        const tRes: string = cdeNMI.MyEngine.ValidateUID(this.mUID.MyNMIControl.GetProperty("Value"));
                        if (tRes) {
                            this.ShakeNError(tRes);
                            return;
                        }
                    }
                    cdeNMI.Key13Event = null;
                    this.SetProperty("Text", "...verifying credentials...");
                    this.mUID.SetProperty("Disabled", true);
                    this.mPWD.SetProperty("Disabled", true);
                    if (this.mPWD2)
                        this.mPWD2.SetProperty("Disabled", true);
                    this.mLoginButton.SetProperty("Disabled", true);
                    if (cdeNMI.MyEngine)
                        cdeNMI.MyEngine.Login(tTarget, this.mUID.GetProperty("Value"), this.mPWD.GetProperty("Value"));
                    else {
                        if (this.HasEvent("OnLogin"))
                            this.FireEvent(true, "OnLogin", this.mUID.GetProperty("Value"), this.mPWD.GetProperty("Value"));
                        else {
                            if (cdeNMI.MyPopUp)
                                cdeNMI.MyPopUp.Show("NMI requires login but no login provider found. Access is denied.", true, null, null, () => {
                                    cdeNMI.ResetBrowserToPortal();
                                });
                        }
                    }

                }
            }
        }

        ShakeNError(pText: string) {
            this.tLoginGroup.GetElement().addEventListener("animationend", () => {
                //this.tLoginGroup.GetElement().removeEventListener("animationend", arguments.callee);
                this.tLoginGroup.GetElement().classList.remove("cde-animate-shake");
                this.ResetDialog();
            });
            this.tLoginGroup.GetElement().classList.add("cde-animate-shake");
            this.mStatusMsg.SetProperty("Text", pText);
            this.mStatusMsg.SetProperty("ClassName", "cdeEngineStatusRed");
        }

        public ShowMeshSelect(pMeshes: Array<cde.TheMeshPicker>) {
            this.tLoginGroup.SetProperty("Visibility", false);
            this.mMeshPicker = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.MeshPicker).Create(this);
            this.mMeshPicker.SetProperty("SetMesh", pMeshes);
        }

        public FinishLogin(bSuccess: boolean, pReason?: string, pUserPref?: cde.TheUserPreferences) {
            if (this.bFinishCalled || this.bLoginFired)
                return;
            if (!bSuccess) {
                this.ShakeNError(pReason);
            }
            else {
                this.bFinishCalled = true;
                cdeNMI.TL.RegisterEvent("OnLCIDChanged", () => {
                    if (this.bLoginFired)
                        return;
                    this.bLoginFired = true;
                    if (this.tLoginGroup.GetProperty("Visibility") === false) {
                        this.mMeshPicker.GetElement().addEventListener("animationend", () => {
                            this.SetProperty("Visibility", false);
                            this.mMeshPicker.GetElement().classList.remove("cdeLogin-animate-zoom");
                            this.FireEvent(false, "OnLogin", bSuccess, pUserPref);
                        });
                        this.mMeshPicker.GetElement().classList.add("cdeLogin-animate-zoom");
                    } else {
                        this.tLoginGroup.GetElement().addEventListener("animationend", () => {
                            this.SetProperty("Visibility", false);
                            this.tLoginGroup.GetElement().classList.remove("cdeLogin-animate-zoom");
                            this.FireEvent(false, "OnLogin", bSuccess, pUserPref);
                        });
                        this.tLoginGroup.GetElement().classList.add("cdeLogin-animate-zoom");
                        this.mStatusMsg.SetProperty("ClassName", "cdeEngineStatusGreen");
                        this.mStatusMsg.SetProperty("Text", "Done...Requesting Portal...please wait");
                    }
                });
                this.mStatusMsg.SetProperty("Text", "Login successful! Loading language...please wait");
                this.mStatusMsg.SetProperty("ClassName", "cdeEngineStatusYellow");
                cdeNMI.TL.SetLCID(cde.MyBaseAssets.MyServiceHostInfo.CurrentLCID);
            }
        }

        public ResetDialog() {
            if (cde.MyBaseAssets.HasAutoLogin === true)
                return;
            if (cde.MyBaseAssets.MyServiceHostInfo.LoginDisallowed)
                return;
            cdeNMI.Key13Event = () => {
                this.LoginClick();
            };
            this.mUID.SetProperty("Disabled", false);
            this.mPWD.SetProperty("Disabled", false);
            if (this.mPWD2)
               this.mPWD2.SetProperty("Disabled", false);
            this.mLoginButton.SetProperty("Disabled", false);
            this.mUID.SetProperty("Value", "");
            this.mPWD.SetProperty("Value", "");
            if (this.mScope) {
                this.mScope.SetProperty("Visibility", false);
                this.mScope.SetProperty("Disabled", false);
            }
            if (this.mPWD2)
                this.mPWD2.SetProperty("Value", "");
            if (this.mScope)
                this.mScope.SetProperty("Value", "");
            this.mPWD.SetProperty("Label", "Password");
            this.mPWD.SetProperty("EditPlaceholder", "Enter Password");

            if (cde.MyBaseAssets.MyServiceHostInfo.AdminPWMustBeSet) {
                this.mLoginButton.MyNMIControl.SetProperty("Text", "Set Password");
                if (this.mScope)
                    this.mScope.SetProperty("Visibility", true);
                this.mUID.SetProperty("Visibility", true);
                this.mPWD2.SetProperty("Visibility", true);
                this.mPWD2.MyNMIControl.RegisterEvent("OnReturn", () => { this.LoginClick(); });
                if (cde.MyBaseAssets.MyServiceHostInfo.AllowSetScopeWithSetAdmin)
                    this.mScope.SetProperty("Visibility", true);
                this.mHeaderHelp.MyNMIControl.SetProperty("Text", "The Administrator password and email are not set, yet. Please enter a strong password to ensure maximum security.");
            }
            else {
                if (cde.MyBaseAssets.MyServiceHostInfo.IsUsingUserMapper) {
                    this.mLoginButton.MyNMIControl.SetProperty("Text", "Login");
                    this.mUID.SetProperty("Visibility", true);
                    if (this.mPWD2)
                        this.mPWD2.SetProperty("Visibility", false);
                    this.mHeaderHelp.MyNMIControl.SetProperty("Text", "Please login with your credentials");
                }
                else {
                    this.mLoginButton.MyNMIControl.SetProperty("Text", "Set Security ID");
                    this.mUID.SetProperty("Visibility", false);
                    this.mPWD.SetProperty("Label", "Security ID");
                    this.mPWD.SetProperty("EditPlaceholder", "Enter Security ID");
                    if (this.mPWD2)
                        this.mPWD2.SetProperty("Visibility", false);
                    this.mHeaderHelp.MyNMIControl.SetProperty("Text", "Please enter your Security ID");
                }
            }
        }

        SetStatusMsg(pStatusMsg: string, pState: number) {
            let tColor = "cdeEngineStatusGreen";
            switch (pState) {
                case 2: tColor = "cdeEngineStatusYellow"; break;
                case 3: tColor = "cdeEngineStatusRed"; break;
            }
            this.mStatusMsg.SetProperty("Text", pStatusMsg);
            this.mStatusMsg.SetProperty("ClassName", tColor);
        }
    }
}