// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    //////////////////////////////////////////////////////////////////////////////
    /// The NMI Base Service Engine
    //////////////////////////////////////////////////////////////////////////////
    export class TheNMIServiceLocal extends cdeNMI.TheNMIServiceBase {
        public static StartEngine() {
            cdeNMI.MyEngine = new TheNMIServiceLocal();
            cdeNMI.MyEngine.IsConnectedAndReady = true;
            cdeNMI.MyEngine.GetBaseEngine().EngineState.IsInitialized = true;
            cdeNMI.MyEngine.GetBaseEngine().FireEngineIsReady(true);
        }

        constructor() {
            super();
        }

        public ValidateUID(pUID: string): string {
            if (pUID && pUID.length > 2)
                return null;
            return "Wrong Username!";
        }

        public Login(pTarget: string, pUID: string, pPWD?: string, pPlatform?: number) {
            if (pUID === "nmi") {
                cde.MyBaseAssets.MyCommStatus.UserPref = new cde.TheUserPreferences(); //We could set some values here 
                this.FireEvent(true, "CDE_LOGIN_EVENT", true);
            }
            else
                this.FireEvent(true, "CDE_LOGIN_EVENT", false, "Login failed! unknown credentials");
        }

        public RequestEngineStatus() {
            this.FireEvent(true, "CDE_SETSTATUSMSG", "Local-Engine Provider ready", 1);
        }

        //////////////////////////////////////////////////////////////////////////////
        /// NMI Global Scripts Management
        //////////////////////////////////////////////////////////////////////////////
        public cdeGetScript(pScriptName: string, pCallBack = null, cookie = null, pTimeout=0) {
            if (!pScriptName) return;
            fetch("/ClientBin/Scripts/" + pScriptName).then(d => {
                if (d.ok) {
                    d.text().then(txt => {
                        const s: HTMLScriptElement = document.createElement('script');
                        const prior = document.getElementsByTagName('script')[0];
                        s.type = "text/javascript";
                        s.text = txt.replace(String.fromCharCode(65279), '');
                        prior.parentNode.insertBefore(s, prior);

                        pCallBack(cookie, txt);
                    });
                }
            });
        }

        public cdeGetStyle(pResource: string, pCallBack = null, cookie = null, pTimeout=0) {
            if (!pResource) return;
            fetch("/ClientBin/CSS/" + pResource).then(d => {
                if (d.ok) {
                    d.text().then(txt => {
                        const css: any = document.createElement('style');
                        css.type = 'text/css';
                        if (css.styleSheet)
                            css.styleSheet.cssText = txt.replace(String.fromCharCode(65279), '');
                        else
                            css.appendChild(document.createTextNode(txt.replace(String.fromCharCode(65279), '')));
                        document.getElementsByTagName("head")[0].appendChild(css);

                        pCallBack(cookie, txt);
                    });
                }
            });
        }

        PublishToNodeGET_NMI_DATA(pRes: string) {
            const tParts: string[] = pRes.split(':');
            fetch("/ClientBin/JSON/" + tParts[0] + ".JSON").then(d => {
                if (d.ok) {
                    d.json().then(tJSon => {
                        this.OnHandleMessage(tJSon);
                    });
                }
            });
        }

        public cdeGetResource(pResource: string, pCallBack, cookie = null, pTimeout=0) {
            if (!pResource) return;
            fetch("/ClientBin/" + pResource).then(d => {
                if (d.ok) {
                    d.text().then(txt => {
                        pCallBack(cookie, txt);
                    });
                } else {
                    pCallBack(cookie, "ERR:" + d.statusText);
                }
            });
        }

        public cdeGetImage(pResource: string, pCallBack, cookie = null, pTimeout=0) {
            if (!pResource) return;
            fetch("/ClientBin/" + pResource).then(d => {
                if (d.ok) {
                    d.text().then(txt => {
                        pCallBack(cookie, txt);
                    });
                } else {
                    pCallBack(cookie, "ERR:" + d.statusText);
                }
            });
        }

        public GetScreenMeta(pGuid: string, pForceLoad: boolean): boolean {
            this.PublishToNodeGET_NMI_DATA(pGuid);
            return false;
        }

        OnHandleMessage(pProcessMessage: cde.TheProcessMessage) {
            const pMSG: cde.TSM = pProcessMessage.Message;
            if (!pMSG) return;

            if (super.BaseOnHandleMessage(pProcessMessage))
                return;

            if (cdeNMI.MyScreenManager) {
                cdeNMI.MyScreenManager.ShowView();
            }
        }
    }
}

