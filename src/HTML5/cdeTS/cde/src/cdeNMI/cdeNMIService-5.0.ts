// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    //////////////////////////////////////////////////////////////////////////////
    /// The NMI Base Service Engine
    //////////////////////////////////////////////////////////////////////////////
    export class TheNMIService extends cdeNMI.TheNMIServiceBase {
        public static StartEngine() {
            const tEngine = new TheNMIService();
            cdeNMI.MyEngine = tEngine;

            tEngine.MyPingTimer = setInterval(() => {
                if (Object.keys(tEngine.MyKnownNodes).length === 0)
                    return;
                const tNow: number = (new Date()).getTime();
                for (const mh in tEngine.MyKnownNodes) {
                    //if (tNow - tEngine.MyKnownNodes[mh].LastPing > 30000)
                    cdeNMI.MyEngine.PublishToNMI("NMI_NODEPING", "", mh);
                    if (tEngine.MyKnownNodes[mh].IsDown !== true && tNow - tEngine.MyKnownNodes[mh].LastPing > 60000) {
                        tEngine.MyKnownNodes[mh].IsDown = true;
                        cdeNMI.MyScreenManager.UpdateScreenStatus(mh, true);
                    }
                }
            }, 10000);
            window.addEventListener("message", (e: MessageEvent) => {
                try {
                    if (!e.data)
                        return;
                    //let res = e.data;
                    const cred = e.data.split(';:;');
                    switch (cred[0]) {  //TODO: V4.109: Security Review: can we control this by the Relay? Reflect all to Relay?
                        case "APPLOG":
                            if (cred.length > 2) {
                                cdeNMI.MyEngine.Login(cred[1], cred[2]);
                                //res = "Done";
                            }
                            break;
                    }
                    if (e.data.startsWith("OK:")) return;
                    //const tText: string = cde.CStr(e.data);
                    //const tOrig: string = cde.CStr(e.origin);
                    //e.source.postMessage("OK:" + tText, tOrig); //TODO: 4.109: Why does this not work??
                }
                catch {
                    // ignored
                }
            }, false);
            if (cde.MyCommChannel) {
                cde.MyCommChannel.RegisterEvent("CDE_SETSTATUSMSG", (s, m, st) => { tEngine.sinkStatus(m, st); });
                cde.MyCommChannel.RegisterEvent("CDE_LOGIN_EVENT", (s, l, r, p) => { tEngine.sinkLogin(l, r, p); });
                cde.MyCommChannel.RegisterEvent("CDE_INCOMING_MSG", (s, p) => { tEngine.FireIncoming(p); });
                cde.MyCommChannel.RegisterEvent("CDE_SELECT_MESH", (s, p) => { tEngine.RequestSelectMesh(p); });
                cde.MyBaseAssets.MyEngines[cdeNMI.eTheNMIEngine].SendInitialize();
            }
            else {
                tEngine.GetBaseEngine().FireEngineIsReady(true);
            }
        }

        constructor() {
            super();
            this.MyBaseEngine.RegisterEvent("IncomingMessage", (pSender: cde.ICDEBaseEngine, pProcessMessage: cde.TheProcessMessage) => { this.OnHandleMessage(pProcessMessage); });
        }

        sinkStatus(pStatus: string, pLevel: number) {
            this.mLastStatus = pStatus;
            this.mLastState = pLevel;
            this.FireEvent(true, "CDE_SETSTATUSMSG", pStatus, pLevel);
        }
        sinkLogin(bIsLoggedIn: boolean, pReason: string, pUserPref: cde.TheUserPreferences) {
            this.FireEvent(true, "CDE_LOGIN_EVENT", bIsLoggedIn, pReason, pUserPref);
        }

        public RequestEngineStatus() {
            this.FireEvent(true, "CDE_SETSTATUSMSG", this.mLastStatus, this.mLastState);
        }
        public RequestSelectMesh(pMeshes) {
            this.FireEvent(true, "CDE_SELECT_MESH", pMeshes);
        }

        mLastStatus = "NMI-Engine is starting...";
        mLastState = 0;
        AreEnginesRequested = false;
        MyKnownNodes: cdeNMI.TheNodeInfo[] = new Array<cdeNMI.TheNodeInfo>();
        MyPingTimer = null;
        MyGlobalResources: TheNMIResource[] = [];
        AddToGlobalScripts(pRes: TheNMIResource) {
            if (!pRes) return;
            this.MyGlobalResources.push(pRes);
            if (pRes.Timeout && pRes.Timeout > 0) {
                pRes.TimeoutHandler = setTimeout(() => {
                    pRes.Resource = "TIMEOUT";
                    TheNMIService.FireCallbacks(pRes);
                }, pRes.Timeout);
            }
        }

        public PublishToNodeGET_NMI_DATA(pRes: string) {
            this.PublishToNMI('NMI_GET_DATA:' + pRes);
        }

        //////////////////////////////////////////////////////////////////////////////
        /// NMI Global Scripts Management
        //////////////////////////////////////////////////////////////////////////////
        public PublishToNMI(pCommand: string, pPayload?: string, pTargetNode?: string, bNodeIsOwner?: boolean) {
            if (pTargetNode) {
                if (bNodeIsOwner === true)
                    this.GetBaseEngine().PublishToOwner(pTargetNode, pCommand, pPayload);
                else
                    this.GetBaseEngine().PublishToNode(pTargetNode, pCommand, pPayload);
            }
            else
                this.GetBaseEngine().PublishToService(pCommand, pPayload);
        }

        public cdeGetScript(pScriptName: string, pCallBack = null, cookie = null, pTimeout=0) {
            if (!pScriptName) return;
            for (let mh = 0; mh < this.MyGlobalResources.length; mh++) {
                if (this.MyGlobalResources[mh].ResourceName === pScriptName) {
                    if (this.MyGlobalResources[mh].IsCreated === true && pCallBack)
                        pCallBack(this.MyGlobalResources[mh].Cookie, this.MyGlobalResources[mh].Resource);
                    return;
                }
            }
            if (pCallBack) {
                const t: TheNMIResource = { ResourceName: pScriptName, CallBacks: [], Cookie: cookie, IsCreated: false, Resource: null, Timeout: pTimeout };
                t.CallBacks.push(pCallBack);
                this.AddToGlobalScripts(t);
            }

            this.GetBaseEngine().PublishToService("NMI_GET_GLOBAL_SCRIPT", pScriptName);
        }


        private CreateGlobalScript(pScriptName: string, pScript: string): boolean {
            let mh = 0;
            for (mh = 0; mh < this.MyGlobalResources.length; mh++) {
                if (this.MyGlobalResources[mh].ResourceName === pScriptName) {
                    if (this.MyGlobalResources[mh].IsCreated === true)
                        return false;
                    else {
                        this.MyGlobalResources[mh].IsCreated = true
                        break;
                    }
                }
            }
            try {
                const s: HTMLScriptElement = document.createElement('script');
                const prior = document.getElementsByTagName('script')[0];
                s.type = "text/javascript";
                s.text = pScript.replace(String.fromCharCode(65279), '');
                prior.parentNode.insertBefore(s, prior);
                TheNMIService.FireCallbacks(this.MyGlobalResources[mh]);
            }
            catch (e) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:CreateGlobalScripts", "Script Execution (" + pScriptName + ") failed with " + e + ":" + e.stack);
            }
        }

        private static FireCallbacks(pNMIRes: TheNMIResource) {
            if (!pNMIRes) return;
            if (pNMIRes.TimeoutHandler && pNMIRes.TimeoutHandler > 0)
                clearTimeout(pNMIRes.TimeoutHandler);
            for (let mh = 0; mh < pNMIRes.CallBacks.length; mh++) {
                if (pNMIRes.CallBacks[mh]) {
                    pNMIRes.CallBacks[mh](pNMIRes.Cookie, pNMIRes.Resource);
                }
            }
        }

        public cdeGetStyle(pResource: string, pCallBack = null, cookie = null, pTimeout=0) {
            if (!pResource) return;
            for (let mh = 0; mh < this.MyGlobalResources.length; mh++) {
                if (this.MyGlobalResources[mh].ResourceName === pResource) {
                    if (this.MyGlobalResources[mh].IsCreated === true && pCallBack)
                        pCallBack(this.MyGlobalResources[mh].Cookie, this.MyGlobalResources[mh].Resource);
                    return;
                }
            }
            if (pCallBack) {
                const t: TheNMIResource = { ResourceName: pResource, CallBacks: [], Cookie: cookie, IsCreated: false, Resource: null, Timeout: pTimeout };
                t.CallBacks.push(pCallBack);
                this.AddToGlobalScripts(t);
            }
            this.GetBaseEngine().PublishToService("NMI_GET_GLOBAL_STYLE", pResource);
        }

        private CreateInlineCSS(pResName: string, pResource: string) {
            let mh = 0;
            for (mh = 0; mh < this.MyGlobalResources.length; mh++) {
                if (this.MyGlobalResources[mh].ResourceName === pResName) {
                    if (this.MyGlobalResources[mh].IsCreated === true)
                        return false;
                    else {
                        this.MyGlobalResources[mh].IsCreated = true
                        break;
                    }
                }
            }
            try {
                const css: any = document.createElement('style');
                css.type = 'text/css';
                if (css.styleSheet)
                    css.styleSheet.cssText = pResource.replace(String.fromCharCode(65279), '');
                else
                    css.appendChild(document.createTextNode(pResource.replace(String.fromCharCode(65279), '')));

                document.getElementsByTagName("head")[0].appendChild(css);
                TheNMIService.FireCallbacks(this.MyGlobalResources[mh]);
            }
            catch (e) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheNMIService:CreateInlineCSS", "Style Inlining (" + pResName + ") failed with " + e);
            }
        }

        public cdeGetImage(pResource: string, pCallBack, cookie = null, pTimeout = 0) {
            if (!pResource) return;
            for (let mh = 0; mh < this.MyGlobalResources.length; mh++) {
                if (this.MyGlobalResources[mh].ResourceName === pResource) {
                    if (pCallBack) {
                        if (this.MyGlobalResources[mh].IsCreated === true)
                            pCallBack(this.MyGlobalResources[mh].Cookie, this.MyGlobalResources[mh].Resource);
                        else {
                            if (this.MyGlobalResources[mh].Cookie !== cookie)
                                this.MyGlobalResources[mh].CallBacks.push(pCallBack);
                        }
                    }
                    return;
                }
            }
            if (pCallBack) {
                const t: TheNMIResource = { ResourceName: pResource, CallBacks: [], Cookie: cookie, IsCreated: false, Resource: null, Timeout: pTimeout };
                t.CallBacks.push(pCallBack);
                this.AddToGlobalScripts(t);
            }
            this.GetBaseEngine().PublishToService("NMI_GET_GLOBAL_IMAGE", pResource);
        }

        public cdeGetResource(pResName: string, pCallBack, cookie = null, pTimeout = 0) {
            if (!pResName) return;
            for (let mh = 0; mh < this.MyGlobalResources.length; mh++) {
                if (this.MyGlobalResources[mh].ResourceName === pResName) {
                    let tTryAgain = false;
                    if (pCallBack) {
                        if (this.MyGlobalResources[mh].IsCreated === true)
                            pCallBack(this.MyGlobalResources[mh].Cookie, this.MyGlobalResources[mh].Resource);
                        else {
                            this.MyGlobalResources[mh].CallBacks.push(pCallBack);
                            if (this.MyGlobalResources[mh].Resource === "TIMEOUT") {
                                this.MyGlobalResources[mh].Resource = null;
                                tTryAgain = true;
                            }
                        }
                    }
                    if (!tTryAgain)
                        return;
                }
            }
            if (pCallBack) {
                const t: TheNMIResource = { ResourceName: pResName, CallBacks: [], Cookie: cookie, IsCreated: false, Resource: null, Timeout: pTimeout };
                t.CallBacks.push(pCallBack);
                this.AddToGlobalScripts(t);
            }
            if (cde.MyCommChannel) {
                if (cde.MyBaseAssets.MyServiceHostInfo.IsWebHosted === true || !cde.MyCommChannel.IsReady) {
                    cde.MyCommChannel.GetResourceString(pResName, (pRes: string, pResData) => {
                        this.ReturnGlobalResource(pRes, pResData);
                    });
                } else {
                    this.GetBaseEngine().PublishToService("NMI_GET_GLOBAL_RESOURCE", pResName);
                }
            }
            else
                this.ReturnGlobalResource(pResName, null);
        }
        private ReturnGlobalResource(pResName: string, pResource: string) {
            let mh = 0;
            let bFound = false;
            for (mh = 0; mh < this.MyGlobalResources.length; mh++) {
                if (this.MyGlobalResources[mh].ResourceName === pResName) {
                    if (!this.MyGlobalResources[mh].IsCreated) {
                        if (pResource)
                            this.MyGlobalResources[mh].Resource = pResource.replace(String.fromCharCode(65279), '');
                        this.MyGlobalResources[mh].IsCreated = true
                    }
                    bFound = true;
                    break;
                }
            }
            try {
                if (bFound)
                    TheNMIService.FireCallbacks(this.MyGlobalResources[mh]);
                else
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheNMIService:ReturnGlobalResource", "Resource sent but not found in request table (" + pResName + ")");
            }
            catch (e) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheNMIService:ReturnGlobalResource", "Resource return (" + pResName + ") failed with " + e);
            }
        }

        public CheckForUpdates() {
            if (cdeNMI.MyToast)
                cdeNMI.MyToast.ShowToastMessage("Checking for update...", "Updates will be visible in the main portal. Touch the home icon to see if you have updates", 10000);
            this.PublishToNMI('NMI_CHECK4_UPDATE');
        }

        public GetScreenMeta(pGuid: string, pForceLoad: boolean): boolean {
            if ((!cdeNMI.MyNMIModels[cde.GuidToString(pGuid)] && !this.MetaRequested[cde.GuidToString(pGuid)]) || pForceLoad) {
                if (pForceLoad) {
                    cdeNMI.MyNMIModels[cde.GuidToString(pGuid)] = null;
                }
                this.PublishToNMI('NMI_GET_SCREENMETA' + (pForceLoad ? 'F' : ''), pGuid); // Guid is Dashboard ID
                this.MetaRequested[cde.GuidToString(pGuid)] = true;
                return true;
            }
            return false;
        }

        public GetScene(sceneID: string) {
            this.PublishToNMI('NMI_GET_SCENE', sceneID);
        }

        public IsNodeDown(pNodeID: string): boolean {
            return this.MyKnownNodes[pNodeID] && this.MyKnownNodes[pNodeID].IsDown === true;
        }

        public GetKnownNodeName(pNodeID: string): string {
            if (this.MyKnownNodes[pNodeID])
                return this.MyKnownNodes[pNodeID].NodeName;
            return "";
        }

        public RegisterKnownNode(pNodeID: string, pNodeName?: string) {
            let tNode: TheNodeInfo = null;
            if (this.MyKnownNodes[pNodeID])
                tNode = this.MyKnownNodes[pNodeID];
            else
                tNode = new TheNodeInfo();
            tNode.cdeN = pNodeID;
            if (tNode.IsDown === true) {
                tNode.IsDown = false;
                if (cdeNMI.MyScreenManager)
                    cdeNMI.MyScreenManager.UpdateScreenStatus(pNodeID, false);
            }
            tNode.IsDown = false;
            if (!tNode.NodeName)
                tNode.NodeName = pNodeName ? pNodeName : pNodeID;
            if (tNode.NodeName === pNodeID && pNodeName)
                tNode.NodeName = pNodeName;
            tNode.LastPing = (new Date()).getTime();
            this.MyKnownNodes[pNodeID] = tNode;
        }

        public FireIncoming(pProcessMessage: cde.TheProcessMessage) {
            if (!pProcessMessage || !pProcessMessage.Message) return;

            if (pProcessMessage.Message.ENG === eTheNMIEngine) {
                if (!cdeNMI.MyTCF.FireControls(pProcessMessage))
                    this.FireEvent(true, "IncomingMessage", pProcessMessage);
                //return;
            }

            const myNmiIncomingEvent = this.MyNMIIncomingEvents[pProcessMessage.Message.ENG];
            for (const tInfo in myNmiIncomingEvent) {
                //if (myNmiIncomingEvent.hasOwnProperty(tInfo)) {
                    const tControl = myNmiIncomingEvent[tInfo];
                    if (tControl) {
                        tControl.FireEvent(false, "IncomingMessage", new cde.TheProcessMessage(pProcessMessage.Topic, pProcessMessage.Message));
                    }
                //}
            }
        }

        // Message Handler for C-DEngine Messages
        OnHandleMessage(pProcessMessage: cde.TheProcessMessage) {
            const pMSG: cde.TSM = pProcessMessage.Message;
            if (!pMSG) return;

            if (!this.AreEnginesRequested && cde.MyBaseAssets.MyCommStatus.IsUserLoggedIn) {
                this.AreEnginesRequested = true;
                this.PublishToNMI("NMI_GET_ENGINEJS");
            }

            this.RegisterKnownNode(cde.TSM.GetOriginator(pMSG));
            if (super.BaseOnHandleMessage(pProcessMessage)) {
                if (cdeNMI.MyScreenManager) {
                    cdeNMI.MyScreenManager.ShowView();
                }
                return;
            }

            const tCmd: string[] = pMSG.TXT.split(':');
            switch (tCmd[0]) {
                case "NMI_GLOBAL_IMAGE":
                    if (pMSG.PLS && tCmd.length > 1) {
                        this.ReturnGlobalResource(tCmd[1], pMSG.PLS);
                    }
                    break;
                case "NMI_GLOBAL_RESOURCE":
                    if (pMSG.PLS && tCmd.length > 1) {
                        this.ReturnGlobalResource(tCmd[1], pMSG.PLS);
                    }
                    break;
                case "NMI_GLOBAL_SCRIPT":
                    if (pMSG.PLS && tCmd.length > 1) {
                        this.CreateGlobalScript(tCmd[1], pMSG.PLS);
                    }
                    break;
                case "NMI_GLOBAL_STYLE":
                    if (pMSG.PLS && tCmd.length > 1) {
                        this.CreateInlineCSS(tCmd[1], pMSG.PLS);
                    }
                    break;
                default:
                    return;
            }
            if (cdeNMI.MyScreenManager) {
                cdeNMI.MyScreenManager.ShowView();
            }
        }
        sinkScopeIDSet() {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
        }

    }
}

