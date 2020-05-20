// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

declare namespace SharedWorker {
    interface AbstractWorker extends EventTarget {
        onerror: (ev: ErrorEvent) => any;
    }

    export interface SharedWorker extends AbstractWorker {
        /**
         * the value it was assigned by the object's constructor.
         * It represents the MessagePort for communicating with the shared worker.
         * @type {MessagePort}
         */
        port: MessagePort;
    }

    export interface SharedWorkerGlobalScope extends Worker {
        onconnect: (event: MessageEvent) => void;
    }
}

//declare const SharedWorker: {
//    prototype: SharedWorker.SharedWorker;
//    /***
//     *
//     * @param {string} stringUrl    Pathname to JavaScript file
//     * @param {string} name         Name of the worker to execute
//     */
//    new(stringUrl: string, name?: string): SharedWorker.SharedWorker;
//};


namespace cdeWEB {

    export class cdeWebWorkerComm extends cde.TheThing implements cde.ICDECommChannel {
        constructor() {
            super();
            this.MyWorker = new SharedWorker("ClientBin/CDE/cdeWorker.min.js?" + document.URL);
            this.MyWorker.port.onmessage = (ev: MessageEvent) => {
                try {
                    const message = ev.data;
                    if (message.length > 1) {
                        switch (message[0]) {
                            case "CDE_NEW_LOGENTRY":
                                cde.MyEventLogger.FireEvent(true, message[0], ...message.slice(2));
                                break;
                            default:
                                //if ((<string>message[0]).substr(0, 4) == "GRS_") debugger;
                                this.MyHSI = message[1];
                                cde.MyBaseAssets.MyCommStatus = this.MyHSI;
                                this.FireEvent(true, message[0], ...message.slice(2));
                                break;
                        }
                    }
                }
                catch (ee) {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "WebWorker:OnMessage", ee, 3);
                }
            };
            this.MyWorker.port.start();
        }

        MyWorker: SharedWorker.SharedWorker;
        public PostToWorker(pArray): boolean {
            if (this.MyWorker) {
                this.MyWorker.port.postMessage(pArray);
                return true;
            }
            return false;
        }

        MyHSI: cde.TheWHSI = new cde.TheWHSI();
        ForceDisconnect = false;
        MyConfig: cde.TheCommConfig = null;

        //Public synchronous Interface Methods returning a value
        public get IsConnected(): boolean { return this.ForceDisconnect === true ? false : this.MyHSI.IsConnected; }
        public set IsConnected(value: boolean) { this.MyHSI.IsConnected = value; }

        public get IsReady(): boolean { return this.MyHSI.CurrentRSA !== null; }

        public get HasAutoLogin(): boolean { return this.MyHSI.HasAutoLogin; }

        public RSAEncrypt(text: string, token?: string): string {
            if (!this.MyHSI || !this.MyHSI.CurrentRSA || (this.MyConfig && this.MyConfig.DisableRSA))
                return text;
            if (!token || token.length === 0)
                token = this.MyHSI.CurrentRSA;
            if (!token || token.length === 0) return text

            const keys = token.split(',')
            const key = new RSAKey()

            key.setPublic(keys[1], keys[0])

            return key.encrypt(text)
        }
        //To Here

        public SetTargetRelay(pTarget: string): boolean {
            return this.PostToWorker(["SetTargetRelay", pTarget]);
        }

        public SetConfig(pConfig: cde.TheCommConfig) {
            if (pConfig) {
                this.MyConfig = pConfig;
                this.PostToWorker(["SetConfig", pConfig]);
            }
        }

        public StartCommunication(pConfig?: cde.TheCommConfig) {
            this.MyConfig = pConfig;
            this.PostToWorker(["StartCommunication", pConfig]);
        }

        public SendQueued(pOwner: string, pTopic: string, pEngineName: string, pTXT: string, pPLS: string, pFLG: number, pQDX: number, pLVL: number, pTarget?: string, pGRO?: string, pSender?: string) {
            this.PostToWorker(["SendQueued", pOwner, pTopic, pEngineName, pTXT, pPLS, pFLG, pQDX, pLVL, pTarget, pGRO, pSender]);
        }

        public Subscribe(pTopics: string) {
            this.PostToWorker(["Subscribe", pTopics]);
        }
        public Unsubscribe(pTopics: string) {
            this.PostToWorker(["Unsubscribe", pTopics]);
        }

        public SendToNode(tOrg: string, TargetMessage: cde.TSM, IncludeLocalNode: boolean) {
            this.PostToWorker(["SendToNode", tOrg, TargetMessage, IncludeLocalNode]);
        }

        public SendToOriginator(sourceMessage: cde.TSM, TargetMessage: cde.TSM, IncludeLocalNode: boolean) {
            if (!sourceMessage)
                return;
            this.PostToWorker(["SendToOriginator", sourceMessage, TargetMessage, IncludeLocalNode]);
        }

        public SendTSM(tTSM: cde.TSM, pTopic?: string, pTarget?: string, pSender?: string) {
            this.PostToWorker(["SendTSM", tTSM, pTopic, pTarget, pSender]);
        }

        public SendToFirstNode(TargetMessage: cde.TSM) {
            this.PostToWorker(["SendToFirstNode", TargetMessage]);
        }

        public Logout() {
            this.PostToWorker(["Logout", "User logged out"]);
        }

        public Login(credentials: cde.TheCDECredentials) {
            if (credentials)
                this.PostToWorker(["Login", credentials]);
        }

        public SelectMesh(pMeshID: string) {
            if (pMeshID)
                this.PostToWorker(["SelectMesh", pMeshID]);
        }

        public UpdateCustomSettings(pValues: Array<cde.TheNV>) {
            if (pValues) {
                this.PostToWorker(["UpdateCustomSettings", pValues]);
            }
        }

        public GetResourceString(pResource: string, pCallback?, pErrorCallback?) {
            if (pResource && pCallback) {
                this.RegisterEvent("GRS_/ClientBin/" + pResource, (sender, ...pars) => {
                    pCallback(pResource, ...pars);
                    this.UnregisterEvent("GRS_/ClientBin/" + pResource);
                });
                if (pErrorCallback) {
                    this.RegisterEvent("GRS_ERROR_/ClientBin/" + pResource, (sender, ...pars) => {
                        pErrorCallback(pResource, ...pars);
                        this.UnregisterEvent("GRS_/ClientBin/" + pResource);
                        this.UnregisterEvent("GRS_ERROR_/ClientBin/" + pResource);
                    });
                }
                this.PostToWorker(["GetResourceString", pResource]);
            }
        }

        public GetGlobalResource(pResource: string, pAddHeader: string, pCallback?, pErrorCallback?) {
            if (pResource && pCallback) {
                this.RegisterEvent("GGR_" + pResource, (sender, ...pars) => {
                    pCallback(pResource, ...pars);
                    this.UnregisterEvent("GGR_" + pResource);
                });
                if (pErrorCallback) {
                    this.RegisterEvent("GGR_ERROR_" + pResource, (sender, ...pars) => {
                        pCallback(pResource, ...pars);
                        this.UnregisterEvent("GGR_ERROR_" + pResource);
                    });
                }
                this.PostToWorker(["GetGlobalResource", pResource, pAddHeader]);
            }
        }

        public GetJSON(pUri: string, pCallback?, pErrorCallback?) {
            if (pUri && pCallback) {
                this.RegisterEvent("GJ_" + pUri, (sender, ...pars) => {
                    pCallback(pUri, ...pars);
                    this.UnregisterEvent("GJ_" + pUri);
                    if (pErrorCallback)
                        this.UnregisterEvent("GJ_ERROR_" + pUri);
                });
                if (pErrorCallback) {
                    this.RegisterEvent("GJ_ERROR_" + pUri, (sender, ...pars) => {
                        pErrorCallback(pUri, ...pars);
                        this.UnregisterEvent("GJ_" + pUri);
                        this.UnregisterEvent("GJ_ERROR_" + pUri);
                    });
                }
                this.PostToWorker(["GetJSONAsync", pUri]);
            }
        }
    }
}