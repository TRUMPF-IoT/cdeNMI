// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

namespace cde {
    export const eTheContentService = "ContentService";
    export let IsHostRunning = false;

    //Engine Specific Settings
    export class TheBaseEngine extends TheThing implements ICDEBaseEngine {
        public EngineState: TheEngineState;
        public eventOverideHeartBeat = null;

        constructor() {
            super();
            this.EngineState = new TheEngineState();
        }

        public GetEngineName(): string {
            return this.EngineState.ClassName;
        }

        public SendInitialize() {
            if (!cde.MyCommChannel) return;
            const tTSM: TSM = new cde.TSM(this.EngineState.ClassName);
            tTSM.TXT = "CDE_INITIALIZE";
            tTSM.PLS = this.EngineState.ClassName;
            tTSM.LVL = 3;
            cde.MyCommChannel.SendToFirstNode(tTSM);
        }

        public SendSubscribe() {
            if (!cde.MyCommChannel) return;
            cde.MyCommChannel.Subscribe(this.EngineState.ClassName);
        }

        //Backwards compat:
        public RegisterIncomingMessage(pCallback) {
            if (cde.MyCommChannel) {
                cde.MyCommChannel.RegisterEvent("CDE_INCOMING_MSG", (s, p) => { pCallback(p); });
            }
        }

        // Called when a service was found and telegrams are returned
        public FireEngineIsReady(pIsReady: boolean) {
            this.EngineState.IsEngineReady = pIsReady;
            this.FireEvent(true, "EngineReady", pIsReady);
        }

        public HandleMessage(pTopic: string, pMSG: cde.TSM) {
            this.FireEvent(true, "IncomingMessage", new cde.TheProcessMessage(pTopic, pMSG));
        }

        public PublishToNode(pTargetNode: string, pTXT: string, pPLS?: string, pGRO?: string) {
            if (!cde.MyCommChannel) return;
            if (pPLS === undefined) pPLS = "";
            cde.MyCommChannel.SendQueued("", "CDE_SYSTEMWIDE", this.GetEngineName(), pTXT, pPLS, 0, 5, 3, pTargetNode, pGRO);
        }

        public PublishToFirstNode(pTXT: string, pPLS?: string) {
            if (!cde.MyCommChannel) return;
            if (pPLS === undefined) pPLS = "";
            const tTSM: TSM = new cde.TSM(this.GetEngineName());
            tTSM.TXT = pTXT;
            tTSM.PLS = pPLS;
            cde.MyCommChannel.SendToFirstNode(tTSM);
        }

        public PublishCentral(pTXT: string, pPLS?: string) {
            if (!cde.MyCommChannel) return;
            if (pPLS === undefined) pPLS = "";
            cde.MyCommChannel.SendQueued("", this.GetEngineName(), this.GetEngineName(), pTXT, pPLS, 0, 5, 3, "");
        }

        public PublishToService(pTXT: string, pPLS?: string) {
            if (!cde.MyCommChannel) return;
            if (pPLS === undefined) pPLS = "";
            cde.MyCommChannel.SendQueued("", this.GetEngineName(), this.GetEngineName(), pTXT, pPLS, 8, 5, 3, "");
        }

        public PublishToOwner(pOwner: string, pTXT: string, pPLS?: string, pTarget?: string, pGRO?: string, pSender?: string) {
            if (!cde.MyCommChannel) return;
            if (pPLS === undefined) pPLS = "";
            cde.MyCommChannel.SendQueued(pOwner, this.GetEngineName(), this.GetEngineName(), pTXT, pPLS, 8, 5, 3, pTarget, pGRO, pSender);
        }
        public PublishToOriginator(pTSM: cde.TSM, pTXT: string, pPLS?: string, pSender?: string) {
            if (!cde.MyCommChannel) return;
            if (pPLS === undefined) pPLS = "";
            cde.MyCommChannel.SendQueued(pTSM.OWN, this.GetEngineName(), this.GetEngineName(), pTXT, pPLS, 0, pTSM.QDX, pTSM.LVL, cde.TSM.GetOriginator(pTSM), pTSM.ORG, pSender);
        }

        public RSAEncrypt(text: string, token?: string): string {
            if (cde.MyCommChannel)
                return cde.MyCommChannel.RSAEncrypt(text, token);
            else
                return text;
        }

        public SaveFile(pContent, pName: string, pMime: string, IsBinary: boolean) {
            let ab;
            if (IsBinary) {
                const bString: string = atob(pContent);
                ab = new ArrayBuffer(bString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < bString.length; i++) {
                    ia[i] = bString.charCodeAt(i);
                }
            }
            else {
                ab = pContent;
            }
            const bb = new Blob([ab], { type: pMime });
            const tFS: cde.cdeFileSaver = new cde.cdeFileSaver();
            tFS.SaveAs(bb, pName);
        }
    }

    export function StartEngineHost(): boolean {
        if (cde.IsHostRunning) return false;
        cde.IsHostRunning = true;
        cde.MyContentEngine = cde.StartNewEngine(cde.eTheContentService);
        cde.MyContentEngine.RegisterEvent("IncomingMessage", (pSender: ICDEBaseEngine, pProcessMessage: cde.TheProcessMessage) => {
            const pMSG: cde.TSM = pProcessMessage.Message;
            if (!pMSG) return;

            const tCmd: string[] = pMSG.TXT.split(':');
            switch (tCmd[0]) {
                case "CDE_FILE":
                    if (tCmd.length > 2) {
                        if (pMSG.PLB) {
                            cde.MyContentEngine.SaveFile(pMSG.PLB, tCmd[1], tCmd[2], true);
                        } else {
                            cde.MyContentEngine.SaveFile(pMSG.PLS, tCmd[1], tCmd[2], false);
                        }
                    }
                    break;
                case "CDE_ENGINEJS":
                    if (pMSG.PLS && tCmd.length > 1) {
                        cde.MyContentEngine.RegisterEvent("EngineReady", (a) => {
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
                                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "StartEngineHost:HandleEvent", "CDE_ENGINEJS:" + error + "<br>" + error.stack);
                            }
                        }
                    }
                    break;
                case "CDE_CUSTOM_HTML":
                    if (pMSG.PLS && tCmd.length > 1) {
                        const ele = document.getElementById('content');
                        if (ele)
                            ele.innerHTML = pMSG.PLS;
                    }
                    break;
                case "CDE_CUSTOM_CSS":
                    if (pMSG.PLS) {
                        const tCSS: string[] = pMSG.PLS.split(';');
                        cde.AddCSSToHeader(tCSS[0], tCSS.length > 1 ? tCSS[1] : null);
                    }
                    break;
                default:
                    break;
            }
        });
        if (cde.MyCommChannel) {
            cde.MyCommChannel.RegisterEvent("CDE_INCOMING_MSG", (pSender: ICDECommChannel, tProgress: cde.TheProcessMessage) => {
                //if (tProgress instanceof cde.TheProcessMessage) { //Does not work with Weg Worker Messages
                if (tProgress && tProgress.Message && tProgress.Message.ENG !== '') {
                    if (cde.MyBaseAssets.MyEngines[tProgress.Message.ENG]) {
                        if (!cde.MyBaseAssets.MyEngines[tProgress.Message.ENG].EngineState.IsInitialized || cde.MyBaseAssets.MyEngines[tProgress.Message.ENG].EngineState.IsEngineScoped !== (tProgress.Message.SID !== '')) {
                            cde.MyBaseAssets.MyEngines[tProgress.Message.ENG].EngineState.IsInitialized = true;
                            cde.MyBaseAssets.MyEngines[tProgress.Message.ENG].EngineState.IsEngineScoped = tProgress.Message.SID !== '';
                            cde.MyBaseAssets.MyEngines[tProgress.Message.ENG].FireEngineIsReady();
                        }
                        try {
                            cde.MyBaseAssets.MyEngines[tProgress.Message.ENG].FireEvent(true, "IncomingMessage", tProgress);
                        }
                        catch (e) {
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "error during process Message:" + e, "cdeEngines:StartEngineHost/eTheContentService");
                        }
                        this.HBCounter = 0;
                    } else {
                        if (cde.MyBaseAssets.MyServiceHostInfo.DebugLevel > 0)
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "Engine Not found:" + tProgress.Message.ENG + "(" + tProgress.Message.TXT + ")", "cdeEngines:StartEngineHost/eTheContentService");
                        cde.MyCommChannel.SendQueued("", eTheContentService, eTheContentService, "CDE_GET_ENGINEJS", tProgress.Message.ENG, 8, 5, 3, "");//record that we asked for it already...only ask again if not received in a certain time
                    }
                }
                //}
            });

            //Comm Channel was reset - all Engine Re-Init
            cde.MyCommChannel.RegisterEvent("CDE_REINIT_ENGINES", () => {
                for (const tEngine in cde.MyBaseAssets.MyEngines)
                    if (cde.MyBaseAssets.MyEngines.hasOwnProperty(tEngine))
                        cde.MyBaseAssets.MyEngines[tEngine].SendInitialize();
            })

            //Check if any engine wants to send somethign if the queue is empty and the HB is fired
            cde.MyCommChannel.RegisterEvent("CDE_HB_INJECT", () => {
                for (const tEngine in cde.MyBaseAssets.MyEngines) {
                    if (cde.MyBaseAssets.MyEngines.hasOwnProperty(tEngine)) {
                        cde.MyBaseAssets.MyEngines[tEngine].FireEvent(false, "CDE_HB_INJECT");
                    }
                }
            });

            cde.MyCommChannel.RegisterEvent("CDE_ENGINE_GONE", (pSender: ICDECommChannel, tEngine: string) => {
                if (cde.MyBaseAssets.MyEngines.hasOwnProperty(tEngine)) {
                    cde.MyBaseAssets.MyEngines[tEngine].EngineState.IsInitialized = false;
                    cde.MyBaseAssets.MyEngines[tEngine].FireEngineIsReady(false);
                }
            });
        }
        return true;
    }

    export function StartNewEngine(pEngineName: string): cde.ICDEBaseEngine {
        if (!pEngineName) return null;

        cde.MyBaseAssets.MyEngines[pEngineName] = new cde.TheBaseEngine();
        cde.MyBaseAssets.MyEngines[pEngineName].EngineState.ClassName = pEngineName;
        cde.MyBaseAssets.MyEngines[pEngineName].EngineState.IsInitialized = false;
        cde.MyBaseAssets.MyEngines[pEngineName].EngineState.IsEngineScoped = false;
        cde.MyBaseAssets.MyEngines[pEngineName].SendInitialize();
        return cde.MyBaseAssets.MyEngines[pEngineName];
    }

    export function AddCSSToHeader(pCSSFile: string, pCSSFileLite?: string) {
        let tFileCSS = cde.FixupPath(pCSSFile);//.toLowerCase();
        if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme && pCSSFileLite)
            tFileCSS = cde.FixupPath(pCSSFileLite);//.toLowerCase();
        const links = document.getElementsByTagName("link");
        if (links.length > 0) {
            for (let i = 0; i < links.length; i++) {
                if (links[i].getAttribute("href").toLowerCase() === tFileCSS.toLowerCase())
                    return;
            }
        }
        const fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("cde", "colorScheme");
        fileref.setAttribute("media", "screen");
        fileref.setAttribute("dark", cde.FixupPath(pCSSFile));
        if (pCSSFileLite)
            fileref.setAttribute("lite", cde.FixupPath(pCSSFileLite));
        fileref.setAttribute("cde", "colorScheme");
        const tN: string = cde.MyBaseAssets.MyCommStatus.InitialNPA;
        fileref.setAttribute("href", tFileCSS + (!tN ? "" : "?SID=" + tN.substr(4, tN.length - (4 + (tN.indexOf(".ashx") > 0 ? 5 : 0)))));
        document.getElementsByTagName("head")[0].appendChild(fileref);
    }

    export function CreateScriptInRoot(pScriptName: string, pScript: string) {
        const tRoot: HTMLElement = document.getElementsByTagName("head")[0]; //'document.getElementById("head");
        if (!tRoot) return;
        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "CreateScriptInRoot", "Creating " + pScriptName + " in doc header");
        const tScripEle: HTMLCollectionOf<HTMLScriptElement> = tRoot.getElementsByTagName("script");
        let DoInsert = true;
        if (tScripEle.length > 0) {
            for (let i = 0; i < tScripEle.length; i++) {
                if ((tScripEle[i] as HTMLElement).id === pScriptName) {
                    DoInsert = false;
                    break;
                }
            }
        }
        if (DoInsert) {
            const s: HTMLScriptElement = document.createElement('script');
            s.type = "text/javascript";
            s.text = pScript;
            s.id = pScriptName;
            tRoot.appendChild(s);
        }
    }
}

namespace cdeCommCore {

    export function StartNewEngine(pEngine: string): cde.ICDEBaseEngine {
        return cde.StartNewEngine(pEngine);
    }

    export function PublishToOriginator(pOrg: string, pEngineName: string, pGRO: string, pTXT: string, pPLS?: string, pSender?: string) {
        if (!cde.MyCommChannel) return;
        if (pPLS === undefined) pPLS = "";
        cde.MyCommChannel.SendQueued("", "CDE_SYSTEMWIDE", pEngineName, pTXT, pPLS, 0, 5, 3, pOrg, pGRO, pSender);
    }
    export function PublishToNode(pTargetNode: string, pEngineName: string, pTXT: string, pPLS?: string) {
        if (!cde.MyCommChannel) return;
        if (pPLS === undefined) pPLS = "";
        cde.MyCommChannel.SendQueued("", "CDE_SYSTEMWIDE", pEngineName, pTXT, pPLS, 0, 5, 3, pTargetNode);
    }

    export function RegisterTopic(InitString: string) {
        //if (cde.MyBaseAssets.MyServiceHostInfo.LastSID && cde.MyBaseAssets.MyServiceHostInfo.LastSID != "")
        //    InitString += "@" + cde.MyBaseAssets.MyServiceHostInfo.LastSID;
        cdeCommCore.PublishToFirstNode("ContentService", "CDE_SUBSCRIBE", InitString);
    }


    //Legacy Support please use functions below
    export function GetNextMessage(pOwner: string, pTopic: string, pEngineName: string, pTXT: string, pPLS: string, pFLG: number, pQDX: number, pLVL: number, pTarget?: string, pGro?: string, pSender?: string) {
        if (!cde.MyCommChannel) return;
        if (pPLS === undefined) pPLS = "";
        cde.MyCommChannel.SendQueued(pOwner, pTopic, pEngineName, pTXT, pPLS, pFLG, pQDX, pLVL, pTarget, pGro, pSender);
    }

    export function PublishToFirstNode(pEngineName: string, pTXT: string, pPLS?: string) {
        if (!cde.MyCommChannel) return;
        if (pPLS === undefined) pPLS = "";
        const tTSM: cde.TSM = new cde.TSM(pEngineName);
        tTSM.TXT = pTXT;
        tTSM.PLS = pPLS;
        cde.MyCommChannel.SendToFirstNode(tTSM);
    }
    export function PublishTSMToFirstNode(pTSM: cde.TSM) {
        if (!cde.MyCommChannel) return;
        cde.MyCommChannel.SendToFirstNode(pTSM);
    }

    export function PublishToOwner(pOwner: string, pEngineName: string, pTXT: string, pPLS?: string, pTarget?: string, pGro?: string, pSender?: string) {
        if (!cde.MyCommChannel) return;
        if (pPLS === undefined) pPLS = "";
        cde.MyCommChannel.SendQueued(pOwner, pEngineName, pEngineName, pTXT, pPLS, 8, 5, 3, pTarget, pGro, pSender);
    }

    ///Used by Convenience Apps
    export function PublishToService(pEngineName: string, pTXT: string, pPLS?: string) {
        if (!cde.MyCommChannel) return;
        if (pPLS === undefined) pPLS = "";
        cde.MyCommChannel.SendQueued("", pEngineName, pEngineName, pTXT, pPLS, 8, 5, 3, "");
    }
    export function PublishTSMToService(pTSM: cde.TSM) {
        if (!cde.MyCommChannel) return;
        cde.MyCommChannel.SendTSM(pTSM);
    }

    export function PublishCentral(pEngineName: string, pTXT: string, pPLS?: string) {
        if (!cde.MyCommChannel) return;
        if (pPLS === undefined) pPLS = "";
        cde.MyCommChannel.SendQueued("", pEngineName, pEngineName, pTXT, pPLS, 0, 5, 3, "");
    }
    export function PublishTSMCentral(pTSM: cde.TSM) {
        if (!cde.MyCommChannel) return;
        cde.MyCommChannel.SendQueued(pTSM.OWN, pTSM.ENG, pTSM.ENG, pTSM.TXT, pTSM.PLS, pTSM.FLG, pTSM.QDX, pTSM.LVL, "");
    }

    ///Used by Convenience Apps
    export function IsNotReadyForLogin(): string {
        return (!cde.MyCommChannel || !cde.MyCommChannel.IsReady).toString();
    }

    ///Used by Convenience Apps
    export function DoAppLogin(pUID: string, pPWD?: string, pPlatform?: number) {
        cde.MyBaseAssets.MyServiceHostInfo.IsAppHosted = true;
        if (cdeNMI.MyEngine) {
            cdeNMI.MyEngine.Login(null, pUID, pPWD, pPlatform);
        }
    }

    export function CleanState() {
        cdeNMI.CleanState();
    }
}