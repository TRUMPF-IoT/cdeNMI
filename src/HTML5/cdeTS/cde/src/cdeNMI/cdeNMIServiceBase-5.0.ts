// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

namespace cdeNMI {
    //////////////////////////////////////////////////////////////////////////////
    /// The NMI Base Service Engine
    //////////////////////////////////////////////////////////////////////////////
    export class TheNMIServiceBase extends cde.TheThing implements cdeNMI.INMIEngine {
        constructor() {
            super();
            this.MyBaseEngine = cde.StartNewEngine(cdeNMI.eTheNMIEngine);
            cde.MyBaseAssets.RegisterEvent("OnStringEvent", (sender, tJS, TargetControl, Parameter, PropertyName, params) => { this.OnStringEvent(tJS, TargetControl, Parameter, PropertyName, params); });
        }

        MyBaseEngine: cde.ICDEBaseEngine = null;
        public GetBaseEngine(): cde.ICDEBaseEngine {
            return this.MyBaseEngine;
        }

        public IsConnectedAndReady = false;
        public MyNMIIncomingEvents: string[] = [];      //Not needed in Local...can we drop this????

        public RegisterIncomingMsg(pCtrl: INMIControl, pID: string, pEng?: string) {
            if (!pCtrl)
                return;
            if (!pEng)
                pEng = eTheNMIEngine;
            const tEngs: string[] = pEng.split(";");
            for (let i = 0; i < tEngs.length; i++) {
                if (!this.MyNMIIncomingEvents[tEngs[i]])
                    this.MyNMIIncomingEvents[tEngs[i]] = [];
                this.MyNMIIncomingEvents[tEngs[i]][pID] = pCtrl;
            }
        }

        MetaRequested: string[] = [];
        DataToFetch: string[] = new Array<string>();
        DataFetching: string[] = new Array<string>();    //Should be emtpied if Fetch was successful
        MyLazyTableCallbacks: [][] = [];

        public RequestEngineStatus() {
            this.FireEvent(true, "CDE_SETSTATUSMSG", "BaseEngine is ready", 1);
        }

        OnStringEvent(tJS: string, TargetControl: INMIControl, Parameter: string, PropertyName: string, params: string[]) {
            if (tJS.startsWith("jsAction:")) {
                const pDashType: string[] = tJS.split(':');
                if (pDashType.length < 2) return;
                switch (pDashType[1]) {
                    case "PTS":
                        {
                            if (pDashType.length < 4) return;
                            let tPLS = "";
                            if (pDashType.length > 4)
                                tPLS = pDashType[4];
                            if (cde.MyCommChannel)
                                cde.MyCommChannel.SendQueued("", pDashType[2], pDashType[2], pDashType[3], tPLS, 0, 5, 3, "");
                            if (pDashType.length > 5)
                                cdeNMI.ShowToastMessage(pDashType[5]);
                        }
                        return;
                    case "GS":
                        if (pDashType.length < 3) return;
                        if (cdeNMI.MyEngine)
                            cdeNMI.MyEngine.GetScene(pDashType[2]);
                        return;
                    case "POP":
                        if (pDashType.length < 3) return;
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show(pDashType[2], true);
                        return;
                    case "TOAST":
                        if (pDashType.length < 3) return;
                        if (cdeNMI.MyToast)
                            cdeNMI.MyToast.ShowToastMessage(pDashType[2]);
                        return;
                    case "TTS":
                        if (pDashType.length < 3) return;
                        if (cdeNMI.MyScreenManager)
                            cdeNMI.MyScreenManager.TransitToScreen(pDashType[2], true);
                        return;
                    case "CFU":
                        if (cdeNMI.MyEngine)
                            cdeNMI.MyEngine.CheckForUpdates();
                        return;
                    default:
                        tJS = pDashType[1];
                        break;
                }
            }
            if (tJS.startsWith("TTS:")) {
                if (cdeNMI.MyScreenManager) {
                    const tScrParts: string[] = tJS.split(':');
                    if (tScrParts[1] === "CLOSE") {
                        const tLast: INMIScreen = cdeNMI.MyScreenManager.GetCurrentScreen();
                        if (tLast) {
                            const tOld: string = tLast.GetProperty("OldScreen");
                            if (tOld)
                                cdeNMI.MyScreenManager.TransitToScreen(tOld);
                        }
                    } else {
                        cdeNMI.MyScreenManager.TransitToScreen(cde.GuidToString(tScrParts[1]), true, false, tScrParts.length > 2 ? tScrParts[2] : null);
                    }
                }
                return;
            } else if (tJS.startsWith("GRP:")) {
                cdeNMI.MyTCF.ToggleGroup(TargetControl.MyFormID, tJS.substr(4));
                return;
            } else if (tJS.startsWith("PTOT:")) {
                if (!cde.MyCommChannel) return;
                const tPa: string[] = tJS.substr(5).split(';:;');
                if (tPa.length < 6) return;
                if (tPa[0].length === 0 || PropertyName === tPa[0]) {
                    let tID = TargetControl.GetProperty('MID');
                    if (!tID)
                        tID = TargetControl.GetProperty('ID');
                    cde.MyCommChannel.SendQueued(tPa[1], tPa[2], tPa[2],
                        tPa[3] + ':' + tID + ':' + tPa[4],
                        Parameter + ':' + tPa[4] + ':' + (TargetControl.MyTRF && TargetControl.MyTRF.RowID ? TargetControl.MyTRF.RowID : 0),
                        8, 5, 3,
                        TargetControl.MyTRF ? TargetControl.MyTRF.GetNodeID() : tPa[5]);
                }
                return;
            } else if (tJS.startsWith("PTOR:")) {
                if (!cde.MyCommChannel) return;
                const tPa: string[] = tJS.substr(5).split(';:;');
                if (tPa.length < 6) return;
                if (tPa[0].length === 0 || PropertyName === tPa[0]) {
                    let tID = TargetControl.GetProperty('MID');
                    if (!tID)
                        tID = TargetControl.GetProperty('ID');
                    cde.MyCommChannel.SendQueued(TargetControl.MyTRF ? TargetControl.MyTRF.GetMID() : tPa[1], tPa[2], tPa[2],
                        tPa[3] + ':' + tID + ':' + tPa[4],
                        Parameter, // + ':' + tPa[4] + ':' + (TargetControl.MyTRF && TargetControl.MyTRF.RowID ? TargetControl.MyTRF.RowID : 0),
                        8, 5, 3,
                        TargetControl.MyTRF ? TargetControl.MyTRF.GetNodeID() : tPa[5]);
                }
                return;
            } else if (tJS.startsWith("SEV:")) {
                const tProp: string = tJS.substr(4);
                let ti = ""; if (tProp === "Value") ti = "i";
                if (PropertyName === tProp)
                    TargetControl.SetProperty(ti + "Value", Parameter);
                return;
            } else if (tJS.startsWith("if (PropertyName==")) {
                if (tJS.indexOf("PublishToOwner") < 0) {
                    const tProp: string = GetStringSegment(tJS, "'", "'");
                    let ti = ""; if (tProp === "Value") ti = "i";
                    if (PropertyName === tProp)
                        TargetControl.SetProperty(ti + "Value", Parameter);
                    return;
                }
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.DebugLevel > 0)
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "FireEvent:EVAL", "UPDATE Plugin! eval() will be dropped in the future! Code: " + tJS);
            eval(tJS);
        }

        //////////////////////////////////////////////////////////////////////////////
        /// NMI Data Fetcher
        //////////////////////////////////////////////////////////////////////////////

        public AddDataToFetch(pToFetch: string) {
            if (!this.HasDataToFetch(pToFetch))
                this.DataToFetch.push(pToFetch);
        }

        public HasDataToFetch(pToFetch: string): boolean {
            return cdeNMI.DoesArrayContain(this.DataToFetch, pToFetch);
        }

        public CheckDataToFetch(pScreenID: string) {
            if (!pScreenID) return;
            pScreenID = cde.GuidToString(pScreenID);
            const tScreen: cdeNMI.INMIScreen = cdeNMI.MyScreenManager ? cdeNMI.MyScreenManager.GetScreenByID(pScreenID) : null;
            let HasFound: boolean = (tScreen && tScreen.GetInitialized());
            if (!HasFound) {
                if (this.DataToFetch.length > 0) {
                    for (let i = 0; i < this.DataToFetch.length; i++) {
                        const tParts: string[] = this.DataToFetch[i].split(':');
                        if (cdeNMI.DoesArrayContain(this.DataFetching, cde.GuidToString(tParts[0])))
                            continue;
                        if (cde.GuidToString(tParts[0]) === pScreenID) {
                            if (!cdeNMI.MyTCF.IsControlNameKnown(tParts[1])) {
                                if (!cde.MyBaseAssets.MyEngines[tParts[1]])
                                    cde.StartNewEngine(tParts[1]);
                            }
                            this.PublishToNodeGET_NMI_DATA(this.DataToFetch[i]);
                            this.DataFetching.push(pScreenID);
                            this.DataToFetch.splice(i, 1);
                            HasFound = true;
                            break;
                        }
                    }
                }
            }
            if (!HasFound) {
                if (this.DataFetching.length > 0) {
                    for (let i = 0; i < this.DataFetching.length; i++) {
                        if (this.DataFetching[i] === pScreenID) {
                            HasFound = true;
                            break;
                        }
                    }
                }
                if (!HasFound) {
                    const tNF: string = pScreenID + ':auto:' + pScreenID;
                    this.DataToFetch.push(tNF);
                    this.CheckDataToFetch(pScreenID);
                }
            }
        }

        PublishToNodeGET_NMI_DATA(pRes: string) {
        }

        //////////////////////////////////////////////////////////////////////////////
        /// NMI Lazy Table Loader
        //////////////////////////////////////////////////////////////////////////////

        public FireLazyLoaded(pScreenID: string, pTableName: string, pMirror) {
            if (!pScreenID || !pTableName || !this.MyLazyTableCallbacks[pScreenID + ',' + pTableName]) return;
            for (let mh = 0; mh < this.MyLazyTableCallbacks[pScreenID + ',' + pTableName].length; mh++) {
                if (this.MyLazyTableCallbacks[pScreenID + ',' + pTableName][mh].CallBack) {
                    this.MyLazyTableCallbacks[pScreenID + ',' + pTableName][mh].CallBack(pMirror, this.MyLazyTableCallbacks[pScreenID + ',' + pTableName][mh].Cookie);
                }
            }
        }

        public UnregisterLazyLoader(pScreenID: string, pTableName: string, pCallback) {
            if (!this.MyLazyTableCallbacks[pScreenID + ',' + pTableName])
                return;
            for (let mh = 0; mh < this.MyLazyTableCallbacks[pScreenID + ',' + pTableName].length; mh++) {
                if (this.MyLazyTableCallbacks[pScreenID + ',' + pTableName][mh].CallBack === pCallback) {
                    this.MyLazyTableCallbacks[pScreenID + ',' + pTableName].splice(mh, 1);
                    return;
                }
            }
        }

        public LoadTableLazy(pScreenID: string, pTableName: string, pCallback, cookie) {
            if (!pCallback || !pScreenID || !pTableName) return;
            if (cdeNMI.MyNMIModels[pScreenID] && cdeNMI.MyNMIModels[pScreenID].MyStorageMirror[pTableName]) {
                pCallback(cdeNMI.MyNMIModels[pScreenID].MyStorageMirror[pTableName], cookie);
            } else
                pCallback(null, cookie);
            if (!this.MyLazyTableCallbacks[pScreenID + ',' + pTableName]) {
                this.MyLazyTableCallbacks[pScreenID + ',' + pTableName] = [];
            }
            this.MyLazyTableCallbacks[pScreenID + ',' + pTableName].push({ ScreenID: pScreenID, TableName: pTableName, CallBack: pCallback, Cookie: cookie });
        }

        //////////////////////////////////////////////////////////////////////////////
        /// NMI Global Scripts Management
        //////////////////////////////////////////////////////////////////////////////
        public cdeGetScript(pScriptName: string, pCallBack = null, cookie = null, pTimeout=0) {
        }

        public cdeGetStyle(pResource: string, pCallBack: any = null, cookie: any = null, pTimeout?: number) {
        }

        public cdeGetResource(pResource: string, pCallBack: any, cookie: any = null, pTimeout?: number) {
        }
        public cdeGetImage(pResource: string, pCallBack: any, cookie: any = null, pTimeout?: number) {
        }

        public PublishToNMI(pCommand: string, pPayload?: string, pTargetNode?: string) {

        }

        public CheckForUpdates() {
        }

        public GetScreenMeta(pGuid: string, pForceLoad: boolean): boolean {
            return false;
        }

        public GetScene(sceneID: string) {
        }

        public IsNodeDown(pNodeID: string): boolean {
            return false;
        }

        public GetKnownNodeName(pNodeID: string): string {
            return "";
        }

        public RegisterKnownNode(pNodeID: string, pNodeName?: string) {
        }

        public RequestReloadModel(pModelID: string) {
            this.MetaRequested[cde.GuidToString(pModelID)] = false;
        }

        public ValidateUID(pUID: string): string {
            if (!cdeNMI.Check4ValidEmail(pUID))
                return "eMail invalid! Please enter a valid eMail address";
            return null;
        }

        public Login(pTarget: string, pUID: string, pPWD?: string, pPlatform?: number) {
            if (!cde.MyCommChannel) return;
            if (pTarget) {
                if (cde.MyCommChannel.SetTargetRelay(pTarget))
                    cde.MyCommChannel.StartCommunication();
                else
                    return;
            }
            if (pPlatform) {
                cde.MyBaseAssets.MyServiceHostInfo.WebPlatform = pPlatform;
                this.FireEvent(false, "CDE_SETPLATFORM", pPlatform);
            }
            if (cde.MyBaseAssets.MyServiceHostInfo.IsUsingUserMapper && !cde.MyBaseAssets.MyServiceHostInfo.EnablePinLogin) {
                cde.MyCommChannel.Login({ QPWD: pPWD, QUID: pUID, QToken: null });
            } else {
                cde.MyCommChannel.Login({ QPWD: pUID, QUID: null, QToken: null });
            }
        }

        public SelectMesh(pTargetMesh: string) {
            cde.MyCommChannel.SelectMesh(pTargetMesh);
        }

        BaseOnHandleMessage(pProcessMessage: cde.TheProcessMessage): boolean {
            const pMSG: cde.TSM = pProcessMessage.Message;
            if (!pMSG) return true;

            if (pProcessMessage.Topic === "NMI_ERROR") {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Show(pMSG.PLS, true, null, 1, () => { document.location.reload(true) });
                return true;
            }
            if (pProcessMessage.Topic === "NMI_INFO") {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Show(pMSG.PLS, true);
                return true;
            }
            if (pProcessMessage.Topic === "NMI_TOAST" || pMSG.TXT.endsWith(":ERR")) {
                if (cdeNMI.MyToast)
                    cdeNMI.MyToast.ShowToastMessage(pMSG.TXT, pMSG.PLS);
                return true;
            }
            if (pProcessMessage.Topic === "NMI_ALERT") {
                const tCmd: string[] = pMSG.TXT.split(':;:');
                if (cdeNMI.MyToast)
                    cdeNMI.MyToast.ShowToastMessage("ALERT", pMSG.PLS, tCmd.length > 1 ? cde.CInt(tCmd[1]) : 0);
                return true;
            }

            const tCmd: string[] = pMSG.TXT.split(':');
            let tModel: TheScreenInfo;
            switch (tCmd[0]) {
                case "NMI_ERROR":
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Show(pMSG.PLS, true, null, 1);
                    return true;
                case "NMI_INFO":
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Show(pMSG.PLS, true);
                    return true;
                case "NMI_TOAST":
                    if (cdeNMI.MyToast)
                        cdeNMI.MyToast.ShowToastMessage(pMSG.PLS);
                    return true;
                case "NMI_ALERT":
                    if (cdeNMI.MyToast)
                        cdeNMI.MyToast.ShowToastMessage("Alert!", pMSG.PLS, tCmd.length > 1 ? cde.CInt(tCmd[1]) : 15000);
                    return true;
                case "NMI_AUDIO":
                    {
                        const audio = new Audio(cde.MyBaseAssets.MyCommStatus.MyServiceUrl + "/" + pMSG.PLS);
                        audio.play();
                    }
                    return true;
                case "NMI_TALK":
                    {
                        const tP: string[] = tCmd;
                        cdeSpeech.talk(pMSG.PLS, tP.length > 1 ? tP[1] : "en", tP.length > 2 ? cde.CInt(tP[2]) : 0);
                    }
                    return true;
                case "NMI_RESET":
                    if (tCmd.length > 1) {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show(pMSG.PLS, true);
                    }
                    else {
                        window.location.reload(true);
                    }
                    return true;
                case "NMI_REFRESH_META":
                    if (cdeNMI.MyScreenManager) {
                        if (cdeNMI.MyEngine)
                            cdeNMI.MyEngine.RequestReloadModel(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
                        cdeNMI.MyScreenManager.RequestPortalScreen(true);
                    }
                    return true;
                case "NMI_GS":
                    if (cdeNMI.MyEngine)
                        cdeNMI.MyEngine.GetScene(pMSG.PLS);
                    return true;
                case "NMI_TTS":
                    if (cdeNMI.MyScreenManager)
                        cdeNMI.MyScreenManager.TransitToScreen(pMSG.PLS, true);
                    return true;
                case "NMI_LIVESCREENMETA":
                    if (pMSG.PLS) {
                        tModel = JSON.parse(pMSG.PLS);
                        if (!tModel) break;
                        if (cdeNMI.MyScreenManager)
                            cdeNMI.MyScreenManager.CreateLiveScreen(tModel);
                    }
                    break;
                case "NMI_REQ_DASH":
                    if (pMSG.PLS) {
                        this.PublishToNodeGET_NMI_DATA(pMSG.PLS);
                    }
                    return true;
                case "NMI_NODEPONG":
                    return true;
                case "NMI_SCREENMETA":
                    if (pMSG.PLS) {
                        if (typeof pMSG.PLS === 'string')
                            tModel = JSON.parse(pMSG.PLS);
                        else
                            tModel = pMSG.PLS;
                        if (!tModel) break;
                        this.RegisterKnownNode(tModel.cdeN, tModel.NodeName);
                        if (cdeNMI.MyScreenManager) {
                            cdeNMI.MyScreenManager.CreateDashboard(tModel, (tCmd.length > 1 ? "ScreenGuid=" + tCmd[1] : null));
                        }
                    }
                    break;
                case "NMI_CUSTOM_SCRIPT":
                    if (pMSG.PLS && tCmd.length > 1 && cdeNMI.MyScreenManager) {
                        cdeNMI.MyScreenManager.CreateScriptScreen(tCmd[1], pMSG.PLS);
                    }
                    break;
                case "NMI_ENGINEJS":
                    if (pMSG.PLS && tCmd.length > 1) {
                        cdeNMI.RegisterEvent("EngineReady", (a) => {
                            if (a === tCmd[1])
                                cdeNMI.MyTCF.FireLazyCreate(a);
                        });
                        if (!cde.MyBaseAssets.MyEngines[tCmd[1]]) {
                            cde.CreateScriptInRoot(tCmd[1], pMSG.PLS);
                            cde.StartNewEngine(tCmd[1]);
                            try {
                                cde.cdeEval(tCmd[1] + ".StartEngine()");
                            }
                            catch (error) {
                                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "NMIServiceBase:HandleEvent", "NMI_ENGINEJS:" + error + "<br>" + error.stack);
                            }
                        }
                    }
                    break;
                case "NMI_CUSTOM_HTML":
                    if (pMSG.PLS && tCmd.length > 1 && cdeNMI.MyScreenManager) {
                        cdeNMI.MyScreenManager.CreateHTMLScreen(tCmd[1], pMSG.PLS);
                    }
                    break;
                case "NMI_CUSTOM_CSS":
                    if (pMSG.PLS) {
                        const tCSS: string[] = pMSG.PLS.split(';');
                        cde.AddCSSToHeader(tCSS[0], tCSS.length > 1 ? tCSS[1] : null);
                    }
                    break;
                case "NMI_UPD_DATA_RET":
                    {
                        if (tCmd.length < 2 || tCmd[2] === "ERR")
                            if (cdeNMI.MyPopUp)
                                cdeNMI.MyPopUp.Show('There was an error processing your request: ' + pMSG.PLS, true);
                            else {
                                let tModelMid = "";
                                if (tCmd.length > 2 && tCmd[2] !== "")
                                    tModelMid = cde.GuidToString(tCmd[2]);
                                else
                                    tModelMid = cde.GuidToString(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
                                tModel = cdeNMI.MyNMIModels[tModelMid];
                                if (!tModel)
                                    return true;
                                if (!tModel.MyStorageMirror)
                                    tModel.MyStorageMirror = [];
                                const tTableGuid: string = cde.GuidToString(tCmd[1]);
                                const tRecord = JSON.parse(pMSG.PLS);
                                if (tModel.MyStorageMirror[tTableGuid] && tModel.MyStorageMirror[tTableGuid].length > 0) {
                                    for (let tRowNo = 0; tRowNo < tModel.MyStorageMirror[tTableGuid].length; tRowNo++) {
                                        if (tModel.MyStorageMeta[tTableGuid].IsAlwaysEmpty || tModel.MyStorageMirror[tTableGuid][tRowNo].cdeMID === tRecord.cdeMID) {
                                            tModel.MyStorageMirror[tTableGuid][tRowNo] = tRecord;
                                            this.FireEvent(false, "RecordUpdated_" + tTableGuid + "_" + tRowNo, tModelMid, tTableGuid, tRowNo);
                                            break;
                                        }
                                    }
                                }
                                else {
                                    if (tModel.MyStorageMirror[tTableGuid])
                                        tModel.MyStorageMirror[tTableGuid][0] = tRecord;
                                }
                            }
                    }
                    break;
                case "NMI_SET_SCENE":
                    if (cdeNMI.MyScreenManager) {
                        cdeNMI.MyScreenManager.SetView(JSON.parse(pMSG.PLS) as TheNMIScene, true);
                    }
                    break;
                case "NMI_SET_DATA":
                    if (tCmd.length < 2 || tCmd[2] === "ERR") {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show('There was an error processing your request: ' + pMSG.PLS, true);
                    }
                    else {
                        if (tCmd.length > 2 && tCmd[2] !== "") {
                            tModel = cdeNMI.MyNMIModels[cde.GuidToString(tCmd[2])];
                            if (!tModel) {
                                //TODO: Decide what to do: either request Model or quit!
                                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheNMIService:OnHandleMessage", "Model not found for " + tCmd[2]);
                                return true;
                            }
                            if (!tModel.MyStorageMirror)
                                tModel.MyStorageMirror = [];
                        }
                        else
                            tModel = cdeNMI.MyNMIModels[cde.GuidToString(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen)];
                        if (tModel) {
                            const tTableName: string = cde.GuidToString(tCmd[1]);
                            if (cdeNMI.MyScreenManager)
                                cdeNMI.MyScreenManager.CreateDataViewScreen(tModel, pMSG, tTableName, pMSG.TXT, tCmd.length > 3 ? tCmd[3] : null, (tCmd.length > 6 && tCmd[6] === 'true') || (tCmd.length === 5 && tCmd[4] === 'true'));
                        }
                    }
                    break;
                case "NMI_SCOPID":
                    cde.MyBaseAssets.MyServiceHostInfo.DoesRequireConfiguration = false;
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Show('Your new Security ID is: ' + pMSG.PLS + '</br>Please write it down in a secure place.</br>You will need this ID for any secondary relays or agents that want to talk to this relay', true, null, 0, this.sinkScopeIDSet);
                    return true;
                default:
                    this.FireEvent(true, tCmd[0], pMSG);
                    break;
            }
            return false;
        }
        sinkScopeIDSet() {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.TransitToScreen(cde.MyBaseAssets.MyServiceHostInfo.PortalScreen);
        }


        ///BackCompat Requirements
        public static cdeGetScript(pName: string, pCallback?, pCookie?) {
            cdeNMI.MyEngine.cdeGetScript(pName, pCallback, pCookie);
        }
        public static cdeGetStyle(pResource: string, pCallBack= null, cookie = null) {
            cdeNMI.MyEngine.cdeGetStyle(pResource, pCallBack, cookie);
        }
        public static MyNMISettings: cdeNMI.TheNMISettings = cdeNMI.MyNMISettings;
    }
}

