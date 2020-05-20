// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

namespace cdeWEB {

    export class cdeWebComm extends cde.TheThing implements cde.ICDECommChannel {
        constructor() {
            super();
        }

        MyConfig: cde.TheCommConfig = null;
        DCreds: cde.TheCDECredentials = null;
        get MyHSI(): cde.TheWHSI {
            return cde.MyBaseAssets.MyCommStatus;
        }

        MyStationID = "";               //Global Safe (worker use only)

        IsPosting = false;
        IsRetrying = false;
        MyWebSockets: WebSocket = null;
        MyServiceUrl = "";

        UsesWebSockets = false;
        mLoginSent = false;
        HasStarted = false;

        HealthCounter = 0;
        HBCounter = 0;
        DeadCounter = 0;

        MyHeartBeatMonitor;
        MyCoreQueue: cde.TheDeviceMessage[] = new Array<cde.TheDeviceMessage>();
        Pre4209SID: string = null;

        IsWSConnected = false;
        IsConnectionDown = false;
        TriesTokenLogin = false;

        ForceDisconnect = false;
        get IsConnected(): boolean { return this.ForceDisconnect === true ? false : this.MyHSI.IsConnected; }
        set IsConnected(value) {
            if (this.MyHSI.IsConnected !== value) {
                this.MyHSI.IsConnected = value;
                this.UpdateHSI();
                this.FireEvent(true, "CDE_CONN_CHANGED", value);
            }
        }
        UpdateHSI() {
            this.MyHSI.HasAutoLogin = this.HasAutoLogin;
            this.WriteToIDB();
        }
        public UpdateCallerHSI(pSource: string) {
            this.UpdateHSI();
            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "UpdateHSI", pSource, 1);
        }

        public get IsReady(): boolean { return this.MyHSI.CurrentRSA !== null; }

        public get HasAutoLogin(): boolean { return (this.MyConfig && this.MyConfig.Creds !== null); }


        public SetTargetRelay(pTarget: string): boolean {
            let tParts: string[];
            try {
                tParts = pTarget.split(';:;');
                let t = null;
                if (!cde.IsIE()) {
                    t = new URL(tParts[0]);
                } else {
                    t = document.createElement("a") as HTMLAnchorElement;
                    t.href = tParts[0];
                }
                let tConf: cde.TheCommConfig = this.MyConfig;
                if (tConf === null)
                    tConf = new cde.TheCommConfig(0);
                tConf.host = t.hostname;
                tConf.cdeTIM = new Date();
                tConf.port = cde.CInt(t.port);
                if (t.protocol.indexOf("s:", t.protocol.length - 2) !== -1) {
                    tConf.useTLS = true;
                    if (tConf.port === 0)
                        tConf.port = 443;
                } else {
                    if (tConf.port === 0)
                        tConf.port = 80;
                }
                if (tParts.length > 1) {
                    tConf.Creds = new cde.TheCDECredentials();
                    tConf.Creds.QUID = tParts[1];
                    if (tParts.length > 2)
                        tConf.Creds.QPWD = tParts[2];
                }
                this.SetConfig(tConf);
                return true;
            } catch (ex) {
                const tErr = tParts[0] + " is not a valid Url";
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SetTargetRelay", tErr, 2);
                this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 2);
            }
            return false;
        }

        public SetConfig(pConfig: cde.TheCommConfig) {
            this.MyConfig = pConfig;
            if (!this.MyConfig)
                return;
            if (this.MyConfig.RequestPath && !this.MyHSI.InitialNPA)
                this.MyHSI.InitialNPA = this.MyConfig.RequestPath;
            if (!this.MyConfig.cdeTIM)
                this.MyConfig.cdeTIM = new Date();
            if (!this.MyConfig.TO)
                this.MyConfig.TO = new cde.TheTimeouts();
            if (!this.MyConfig.host && this.MyConfig.uri) {
                this.SetTargetRelay(this.MyConfig.uri);
            }
        }

        public StartCommunication(pConfig?: cde.TheCommConfig) {
            if (this.IsConnected || this.HasStarted)   //don't start twice
            {
                if (this.IsConnected && this.HasStarted)
                    this.FireEvent(true, "CDE_CONN_CHANGED", true);
                return;
            }
            this.IsConnectionDown = false;
            if (!this.MyDB) {
                if (!('indexedDB' in window)) {
                    this.StartCommPhase2(pConfig);
                    return;
                }
                const req = indexedDB.open('cdeDB', 1);
                req.onupgradeneeded = (ev: Event) => {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "In Upgrade Needed", 1);
                    this.MyDB = (ev.target as IDBOpenDBRequest).result;
                    if (!this.MyDB.objectStoreNames.contains('CDEJS')) {
                        this.MyDB.createObjectStore('CDEJS', { keyPath: 'id' });
                    }
                    this.StartCommPhase2(pConfig);
                };
                req.onsuccess = (ev: Event) => {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Open Success", 1);
                    this.MyDB = (ev.target as IDBOpenDBRequest).result;

                    const transaction = this.MyDB.transaction(['CDEJS']);
                    const objectStore = transaction.objectStore('CDEJS');
                    const request = objectStore.get(1);
                    request.onerror = () => {
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Read of Idx1 failed", 3);
                        this.StartCommPhase2(pConfig);
                    };

                    request.onsuccess = () => {
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Read Success", 1);
                        if (request.result) {
                            const tConfig: cde.TheCommConfig = request.result.config;
                            if (tConfig.Creds && tConfig.Creds.QToken && tConfig.Creds.QToken !== "") { //If state is younger than 1minute - use it
                                if (pConfig && pConfig.RequestPath) {
                                    tConfig.RequestPath = pConfig.RequestPath;
                                    if (!this.MyHSI.InitialNPA)
                                        this.MyHSI.InitialNPA = pConfig.RequestPath;
                                }
                                pConfig = tConfig;
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", 'State Restored', 1);
                            }
                            else {
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", 'State ignored', 1);
                                this.DeleteFromIDB();
                            }
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Starting CommPhase2...", 1);
                            this.StartCommPhase2(pConfig);
                        } else {
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", 'No data record', 2);
                            this.StartCommPhase2(pConfig);
                        }
                    };
                };
                req.onerror = (ev: Event) => {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:error", "Error:" + ev, 3);
                    this.StartCommPhase2(pConfig);
                }
            }
            else
                this.StartCommPhase2(pConfig);
        }

        StartCommPhase2(pConfig?: cde.TheCommConfig) {
            if (pConfig) {
                this.SetConfig(pConfig);
            }
            if (this.MyConfig) {
                if (cde.CBool(this.MyConfig.NoISB) === false) {
                    this.HasStarted = true;
                    let tScheme = "http";
                    if (this.MyConfig.useTLS === true)
                        tScheme += "s";
                    this.MyHSI.MyServiceUrl = `${tScheme}://${this.MyConfig.host}:${this.MyConfig.port}`;
                    const isbEndpoint = `${this.MyHSI.MyServiceUrl}/MYISBCONNECT`;
                    this.GetJSON(isbEndpoint, (isb: cde.TheISBConnect) => {
                        if (isb.ERR) {
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartCommunication", "MyISBConnect returned: " + isb.ERR, 3);
                            this.FireEvent(true, "CDE_NO_CONNECT", "ISBConnect returned " + isb.ERR + ". Verify ISBConnect is allow on relay");
                        } else {
                            if (isb.WSP > 0) {
                                let tscheme = "ws";
                                if (isb.TLS === true)
                                    tscheme += "s";
                                this.MyConfig.wsuri = `${tscheme}://${this.MyConfig.host}:${isb.WSP}`;
                            }
                            {
                                let tscheme = "http";
                                if (isb.TLS === true)
                                    tscheme += "s";
                                this.MyServiceUrl = `${tscheme}://${this.MyConfig.host}:${this.MyConfig.port}`;
                            }
                            this.MyConfig.RequestPath = isb.NPA;
                            this.MyHSI.InitialNPA = isb.NPA;
                            this.MyHSI.FirstNodeID = isb.FNI;
                            if (isb.ADR) {
                                this.MyHSI.AdminPWMustBeSet = true;
                                this.MyHSI.AdminRole = isb.ADR;
                            }
                            if (cde.CDbl(isb.VER) > 4)
                                cde.MyBaseAssets.MyServiceHostInfo.NMIVersion = cde.CDbl(isb.VER);
                            else
                                cde.MyBaseAssets.MyServiceHostInfo.NMIVersion = 4.0;
                            this.DoStartComm();
                        }
                    }, (error) => {
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartCommunication", "MyISBConnect failed! :" + error, 3);
                        this.FireEvent(true, "CDE_NO_CONNECT", "ISBConnect failed. Verify ISBConnect is allow on relay");
                    });
                }
            }
            if (!this.HasStarted) {
                this.HasStarted = true;
                this.DoStartComm();
            }
        }

        DoStartComm() {
            let IsStillWorking = false;
            if (!this.MyConfig.TO) {
                this.MyConfig.TO = new cde.TheTimeouts();
            }
            this.StartupWS();

            this.MyHeartBeatMonitor = setInterval(() => {
                if (IsStillWorking || this.IsConnectionDown) return;
                IsStillWorking = true;
                this.HealthCounter++;

                if ((!this.UsesWebSockets || !this.MyConfig.IsWSHBDisabled) && this.HealthCounter % this.MyConfig.TO.HeartBeat === 0) {
                    if (this.MyCoreQueue.length === 0) {
                        this.PickupNextMessage();
                    }
                    if (!this.UsesWebSockets) {
                        if (this.IsConnected) {
                            if (this.HBCounter++ > this.MyConfig.TO.HeartBeatMissed) {
                                this.IsConnected = false;
                                this.IsPosting = false;
                                this.HBCounter = 0;
                            }
                        }
                        else {
                            if (this.DeadCounter++ > this.MyConfig.TO.HeartBeatMissed * 3) {
                                const reason = cde.DateToString(new Date()) + ": Connection Lost because Service is down or unreachable. Click ok to reload this page";
                                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNode:StartCommunication", reason, 3);
                                this.EndSession(reason);
                            }
                        }
                    }
                }
                if (this.UsesWebSockets || ((this.HealthCounter % this.MyConfig.TO.PickupRateDelay) === 0 || this.MyCoreQueue.length > 0))
                    this.SendNextMessage(null);
                IsStillWorking = false;
            }, this.MyConfig.TO.PickupRate);
            this.FireEvent(true, "CDE_COMM_STARTED");
        }

        public GetConnectionType(): string {
            let tConnType = "(REST)";
            if (this.UsesWebSockets)
                tConnType = "(WS)";
            return tConnType;
        }

        PickupNextMessage() {
            const tDevMsg: cde.TheDeviceMessage = new cde.TheDeviceMessage();
            tDevMsg.TOP = "";
            tDevMsg.MSG = null;
            this.MyCoreQueue.push(tDevMsg);
        }

        public SendQueued(pOwner: string, pTopic: string, pEngineName: string, pTXT: string, pPLS: string, pFLG: number, pQDX: number, pLVL: number, pTarget?: string, pGRO?: string, pSender?: string) {
            if (!pEngineName) return;


            if (this.MyCoreQueue.length > 0 && (pTopic === "CDE_PICKUP" || !pTopic))
                return;

            const tTSM: cde.TSM = new cde.TSM(pEngineName);

            if (pTarget && pTarget !== "") {
                pTopic = "CDE_SYSTEMWIDE";
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
                pTopic += ";" + pTarget;
            } else if (pTopic !== "") {
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
            }
            tTSM.SID = this.Pre4209SID;

            tTSM.OWN = pOwner;
            tTSM.FLG = pFLG;
            tTSM.LVL = pLVL;
            tTSM.TXT = pTXT;
            if (pGRO)
                tTSM.GRO = pGRO;
            if ((pFLG & 4096) !== 0) {
                tTSM.PLS = this.RSAEncrypt(pPLS); //ATTENTION: PLS Can exceed encryptable size of token!
            }
            else
                tTSM.PLS = pPLS;
            tTSM.QDX = pQDX;
            tTSM.ORG = cde.MyBaseAssets.MyServiceHostInfo.MyStationID + (pSender ? ":" + pSender : "");

            const tDevMsg: cde.TheDeviceMessage = new cde.TheDeviceMessage();
            tDevMsg.TOP = pTopic;
            tDevMsg.MSG = tTSM;
            this.MyCoreQueue.push(tDevMsg);
        }

        public SendTSM(tTSM: cde.TSM, pTopic?: string, pTarget?: string, pSender?: string) {

            if (this.MyCoreQueue.length > 0 && pTopic === "CDE_PICKUP")
                return;

            if (pTarget && pTarget !== "") {
                pTopic = "CDE_SYSTEMWIDE";
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
                pTopic += ";" + pTarget;
            } else if (pTopic !== "") {
                if (this.Pre4209SID && this.Pre4209SID !== "")
                    pTopic += "@" + this.Pre4209SID;
            }
            tTSM.SID = this.Pre4209SID;

            if ((tTSM.FLG & 4096) !== 0) {
                tTSM.PLS = this.RSAEncrypt(tTSM.PLS); //ATTENTION: PLS Can exceed encryptable size of token!
            }
            tTSM.ORG = cde.MyBaseAssets.MyServiceHostInfo.MyStationID + (pSender ? ":" + pSender : "");

            const tDevMsg: cde.TheDeviceMessage = new cde.TheDeviceMessage();
            tDevMsg.TOP = pTopic ? pTopic : tTSM.ENG;
            tDevMsg.MSG = tTSM;
            this.MyCoreQueue.push(tDevMsg);
        }

        public Subscribe(pTopics: string) {
            const tTSM: cde.TSM = new cde.TSM("ContentService");
            tTSM.TXT = "CDE_SUBSCRIBE";
            tTSM.PLS = pTopics;
            if (this.Pre4209SID && this.Pre4209SID !== "")
                tTSM.PLS += "@" + this.Pre4209SID;
            this.SendToFirstNode(tTSM);
        }
        public Unsubscribe(pTopics: string) {
            const tTSM: cde.TSM = new cde.TSM("ContentService");
            tTSM.TXT = "CDE_UNSUBSCRIBE";
            tTSM.PLS = pTopics;
            if (this.Pre4209SID && this.Pre4209SID !== "")
                tTSM.PLS += "@" + this.Pre4209SID;
            this.SendToFirstNode(tTSM);
        }

        public SendToNode(tOrg: string, TargetMessage: cde.TSM, IncludeLocalNode: boolean) {
            this.SendTSM(TargetMessage, null, tOrg);
            if (IncludeLocalNode)
                this.FireEvent(true, "CDE_INCOMING_MSG", new cde.TheProcessMessage(TargetMessage.ENG, TargetMessage))
        }

        public SendToOriginator(sourceMessage: cde.TSM, TargetMessage: cde.TSM, IncludeLocalNode: boolean) {
            if (!sourceMessage)
                return;
            this.SendTSM(TargetMessage, null, sourceMessage.ORG);
            if (IncludeLocalNode)
                this.FireEvent(true, "CDE_INCOMING_MSG", new cde.TheProcessMessage(TargetMessage.ENG, TargetMessage))
        }

        public SendToFirstNode(TargetMessage: cde.TSM) {
            this.SendTSM(TargetMessage, null, this.MyHSI.FirstNodeID);
        }

        public Logout() {
            this.EndSession("logout");
        }

        EndSession(reason: string) {
            if (cde.CBool(this.IsConnectionDown))
                return;
            clearInterval(this.MyHeartBeatMonitor);
            this.HasStarted = false;
            this.IsConnectionDown = true;
            this.IsConnected = false;
            this.IsRetrying = false;
            this.DeleteFromIDB();
            this.FireEvent(true, "CDE_SESSION_ENDED", reason);
        }

        PostError(MyQueuedMsg: cde.TheCoreQueueContent, errorText: string, pRetryPath: string) {
            this.IsPosting = false;
            if (!this.IsRetrying && errorText === "timeout") {
                this.IsRetrying = true;
                this.SendNextMessage(MyQueuedMsg, pRetryPath);
            }
            else {
                if (MyQueuedMsg.ENG !== "") {
                    this.FireEvent(true, "CDE_ENGINE_GONE", MyQueuedMsg.ENG);
                }
                const tErr: string = cde.DateToString(new Date()) + " Communication was lost.You will need to login again";
                this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "PostError", tErr);
                this.EndSession(tErr);
            }
        }

        ///Picks up any REST based Messages
        SendNextMessage(MyQueuedMsg: cde.TheCoreQueueContent, pRetryPath?: string) {
            if (!MyQueuedMsg && (this.IsPosting || this.MyCoreQueue.length === 0)) return;
            if (!this.UsesWebSockets && (!this.MyConfig.RequestPath || this.MyConfig.RequestPath === "") && !pRetryPath)
                return;
            if (this.UsesWebSockets && this.IsWSConnected === false) return;

            do {
                this.IsPosting = true;
                let uri: string;
                if (!MyQueuedMsg) {
                    let telCnt = 0;
                    const tDevList: cde.TheDeviceMessage[] = [];
                    do {
                        tDevList[telCnt] = this.MyCoreQueue.shift();
                        telCnt++;
                    } while (this.MyCoreQueue.length > 0 && telCnt < 10);
                    MyQueuedMsg = new cde.TheCoreQueueContent("", "", tDevList);

                    const tRPath = (pRetryPath ? pRetryPath : this.MyConfig.RequestPath);
                    uri = this.MyServiceUrl + encodeURI(tRPath);
                    if (this.UsesWebSockets === false && uri.substr(uri.length - 5, 5) === ".ashx")
                        uri = uri.substr(0, uri.length - 5);
                    if (MyQueuedMsg.TOPIC !== "")
                        uri += "?" + encodeURI(MyQueuedMsg.TOPIC);
                    MyQueuedMsg.RQP = uri;
                    pRetryPath = this.MyConfig.RequestPath;
                    this.MyConfig.RequestPath = "";
                } else {
                    uri = MyQueuedMsg.RQP;
                }
                this.WriteToIDB();
                if (this.UsesWebSockets) {
                    this.MyWebSockets.send(MyQueuedMsg.JMSG);
                    this.IsPosting = false;
                    MyQueuedMsg = null;
                }
                else {
                    if (window.fetch) {
                        fetch(uri, {
                            method: "post",
                            body: MyQueuedMsg.JMSG,
                            mode: "cors", // no-cors, cors, *same-origin
                            cache: "no-cache",
                            redirect: "follow", // manual, *follow, error
                            referrer: "no-referrer", // no-referrer, *client
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                            }
                        }).then((resp) => {
                            resp.json().then((m) => {
                                const tMsg: cde.TheDeviceMessage[] = m;
                                this.IsPosting = false;
                                let IsPulsing = false;
                                if (tMsg.length > 0)
                                    for (let i = 0; i < tMsg.length; i++) {
                                        if (tMsg[i].CNT > 0) IsPulsing = true;
                                        this.IsPosting = !this.ProcessDeviceMessage(tMsg[i], false);
                                    }
                                if (IsPulsing)
                                    this.SendNextMessage(null);
                            });
                        }).catch((error) => {
                            this.PostError(MyQueuedMsg, error, pRetryPath);
                        });
                    } else {
                        const xhr: XMLHttpRequest = new XMLHttpRequest();
                        xhr.open('POST', uri);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                try {
                                    const tMsg: cde.TheDeviceMessage[] = JSON.parse(xhr.responseText);
                                    this.IsPosting = false;
                                    let IsPulsing = false;
                                    if (tMsg.length > 0)
                                        for (let i = 0; i < tMsg.length; i++) {
                                            if (tMsg[i].CNT > 0) IsPulsing = true;
                                            this.IsPosting = !this.ProcessDeviceMessage(tMsg[i], false);
                                        }
                                    if (IsPulsing)
                                        this.SendNextMessage(null);
                                }
                                catch (tErr) {
                                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SendNextMessage", "Message Parse Error:" + tErr);
                                    this.PostError(MyQueuedMsg, "parse failed", pRetryPath);
                                }
                            }
                            else if (xhr.status !== 200) {
                                const tStat: string = "Message returned: " + xhr.status + " msg:" + xhr.statusText;
                                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SendNextMessage", tStat);
                                this.PostError(MyQueuedMsg, tStat, pRetryPath);
                            }
                        };
                        xhr.onerror = () => {
                            const tStat: string = "Message returned: " + xhr.status + " msg:" + xhr.statusText;
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:xhrError", tStat);
                            this.EndSession(tStat);
                        };
                        xhr.send(MyQueuedMsg.JMSG);
                    }
                    break;
                }
            } while (this.MyCoreQueue.length > 0);
        }

        ///Starts up the WebSocket Communication
        StartupWS(): boolean {
            if (!this.MyConfig.wsuri) return false;
            let tUri = this.MyConfig.wsuri;
            if (tUri.indexOf(".ashx") < 0)
                tUri += encodeURI(this.MyConfig.RequestPath);
            try {
                this.MyWebSockets = new WebSocket(tUri);
                if (this.MyConfig.TO.WsTimeOut > 0) {
                    setInterval(() => {
                        if (!this.IsWSConnected && this.UsesWebSockets)
                            this.UsesWebSockets = false;
                    }, this.MyConfig.TO.WsTimeOut);
                }
            }
            catch (e) {
                this.MyWebSockets = null;
                return false;
            }
            if (this.MyWebSockets) {
                this.UsesWebSockets = true;
                this.MyWebSockets.onopen = () => {
                    this.FireEvent(true, "CDE_SETSTATUSMSG", "Connecting to WS...", 2);
                    this.MyWebSockets.send("[{\"MET\":0,\"TOP\":\"CDE_INITWS\",\"CNT\":0}]");
                };
                this.MyWebSockets.onmessage = (args) => {
                    if (!this.UsesWebSockets) return;
                    this.IsWSConnected = true;
                    try {
                        if (args.data.substring(0, 1) !== '[') {
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "Strange Response from WServer:" + args.data);
                        }
                        else {
                            let bIsLarge = false;
                            if (args.data.length > 500000) {
                                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "Very large Telegram received:" + args.data.length);
                                bIsLarge = true;
                            }
                            const tMsg: cde.TheDeviceMessage[] = JSON.parse(args.data);
                            if (tMsg && tMsg.length > 0) {
                                for (let i = 0; i < tMsg.length; i++) {
                                    if (!tMsg[i].MSG && tMsg[i].TOP !== "") {
                                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onMessage", tMsg[i].TOP);
                                        return;
                                    } else {
                                        const tTops: string[] = tMsg[i].TOP.split(";:;");
                                        if (tTops[0] === "CDE_CONNECT" && this.MyConfig && this.MyConfig.Creds) {
                                            this.MyHSI.CurrentRSA = tMsg[i].RSA;
                                            this.Login(this.MyConfig.Creds);
                                            continue;
                                        }
                                    }
                                    if (bIsLarge)
                                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "ORG:" + cde.TSM.GetOriginator(tMsg[i].MSG) + "TXT: " + tMsg[i].MSG.TXT);
                                    this.ProcessDeviceMessage(tMsg[i], true);
                                }
                            } else {
                                //debugger;
                            }
                        }
                    }
                    catch (e) {
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartWS", "Error during OnMessage:" + e);
                    }
                };
                this.MyWebSockets.onclose = () => {
                    if (this.UsesWebSockets) {
                        this.UsesWebSockets = false;
                        if (this.IsWSConnected) {
                            const tErr: string = cde.DateToString(new Date()) + (this.mLoginSent ? " Relay refused login and closed connection" : " WS Communication was closed. You will need to login again");
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onclose", tErr);
                            this.EndSession(tErr);
                        } else {
                            const tErr: string = cde.DateToString(new Date()) + (this.mLoginSent ? " a connection could not be established" : " WS Communication was closed. You will need to login again");
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onclose", tErr);
                            this.EndSession(tErr);
                        }
                    }
                }
                this.MyWebSockets.onerror = (args) => {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:onError", "Error during OnMessage:" + args);
                    if (this.UsesWebSockets) {
                        this.UsesWebSockets = false;
                        if (this.IsWSConnected) {
                            const tErr: string = cde.DateToString(new Date()) + " WS Communication was interrupted. You will need to login again";
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onerror", tErr);
                            this.EndSession(tErr);
                        }
                    }
                }
                return true;
            }
            return false;
        }

        ProcessDeviceMessage(tMsg: cde.TheDeviceMessage, ViaWS: boolean): boolean {
            if (tMsg.MSG)
                this.FireEvent(true, "CDE_INCOMING_MSG", new cde.TheProcessMessage(tMsg.TOP.split(":,:")[0], tMsg.MSG))
            if (ViaWS || tMsg.NPA) {
                let IsHSIDirty = false;
                this.MyConfig.RequestPath = tMsg.NPA;
                if (!this.MyHSI.InitialNPA)
                    this.MyHSI.InitialNPA = tMsg.NPA;
                if (tMsg.RSA && tMsg.RSA !== "" && !this.MyHSI.CurrentRSA) {
                    this.MyHSI.CurrentRSA = tMsg.RSA;
                    if (!this.MyHSI.FirstNodeID && tMsg.MSG) {
                        this.MyHSI.FirstNodeID = cde.TSM.GetOriginator(tMsg.MSG);
                        IsHSIDirty = true;
                    }
                    if (this.DCreds) {
                        this.Login(this.DCreds);
                        this.DCreds = null;
                    }
                }
                this.DeadCounter = 0;
                if (tMsg.DID && tMsg.DID !== "" && this.MyStationID !== tMsg.DID) {
                    this.MyStationID = tMsg.DID;
                    IsHSIDirty = true;
                }

                let tIsConnected = this.IsConnected;
                let tJustLoggedIn = false;
                if (tMsg.TOP === 'ERR:CDE_LOGIN_FAILURE') {
                    //debugger;
                    this.MyHSI.UserPref = null;
                    this.mLoginSent = false;
                    this.MyConfig.Creds = null;
                    this.FireEvent(true, "CDE_LOGIN_EVENT", false, "Relay rejected credentials", null);
                    tJustLoggedIn = true;
                    IsHSIDirty = true;
                    this.EndSession("Relay rejected credentials - Login failed");
                }
                else if (tMsg.TOP === 'ERR:CDE_MESHSELECT_FAILURE') {
                    this.MyHSI.UserPref = null;
                    this.mLoginSent = false;
                    this.MyConfig.Creds = null;
                    this.FireEvent(true, "CDE_LOGIN_EVENT", false, "Mesh Picker failed", null);
                    tJustLoggedIn = true;
                    IsHSIDirty = true;
                    this.EndSession("Mesh Selection failed, please reload this page");
                }
                else if (tMsg.TOP.length > 12) {
                    const tLogParts: string[] = tMsg.TOP.split(':');
                    if (!this.MyHSI.IsUserLoggedIn) {
                        if (tLogParts[0] === 'LOGIN_SUCCESS') {
                            this.MyHSI.UserPref = new cde.TheUserPreferences();
                            let tScrParts: string[] = null;
                            if (tLogParts.length > 1) {
                                tScrParts = tLogParts[1].split(';');
                                if (tScrParts.length > 1) {
                                    this.MyHSI.LastPortalScreen = tScrParts[1];
                                    if (tScrParts.length > 2)
                                        this.MyHSI.UserPref.HideHeader = cde.CBool(tScrParts[2]);
                                }
                                if (!cde.IsNotSet(tScrParts[0])) {
                                    this.MyHSI.LastStartScreen = tScrParts[0];
                                    //this.MyHSI.UserPref.ShowClassic = true; //With Deep Link always show old SM
                                }
                                if (tLogParts.length > 2) {
                                    this.MyHSI.UserPref.CurrentUserName = tLogParts[2];
                                    if (tLogParts.length > 3) {
                                        try {
                                            const pos = cde.GetSubstringIndex(tMsg.TOP, ':', 3);
                                            const tres = tMsg.TOP.substr(pos + 1);
                                            if (tres.length > 2 && tres.substr(0, 1) === "{")
                                                this.MyHSI.UserPref = JSON.parse(tres);
                                            else
                                                this.MyHSI.UserPref.LCID = cde.CInt(tres); //OLD NMIs
                                        } catch (ee) {
                                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "Login:Illegal User Preferences received");
                                        }
                                    }
                                }
                            }
                            if (this.MyConfig["LPS"]) {
                                this.MyHSI.LastPortalScreen = this.MyConfig["LPS"];
                                //this.MyHSI.UserPref.PortalScreen = this.MyConfig["LPS"];
                            }
                            if (this.MyConfig["LSSC"]) {
                                this.MyHSI.LastStartScreen = this.MyConfig["LSSC"];
                                //this.MyHSI.UserPref.StartScreen = this.MyConfig["LSSC"];
                            }
                            this.MyHSI.UserPref.ScreenParts = tScrParts;
                            this.Pre4209SID = tMsg.SID; //For FirstNodes pre 4.209
                            if (tMsg.SID && tMsg.SID.substr(0, 2) === "UT") {
                                this.Pre4209SID = null;
                                this.MyConfig.Creds = new cde.TheCDECredentials();
                                this.MyConfig.Creds.QToken = tMsg.SID;
                            }
                            this.FireEvent(true, "CDE_LOGIN_EVENT", true, "Login Successful!", this.MyHSI.UserPref);
                            tJustLoggedIn = true;
                            IsHSIDirty = true;
                            this.mLoginSent = false;
                        } else if (tLogParts[0] === 'SELECT_MESH') {
                            const tMeshPicker: string = tMsg.TOP.substr('SELECT_MESH:'.length);
                            const tMeshes: Array<cde.TheMeshPicker> = JSON.parse(tMeshPicker);
                            this.FireEvent(true, "CDE_SELECT_MESH", tMeshes);
                        }
                    }
                }
                if (!ViaWS && tMsg.CNT > 0 && this.MyCoreQueue.length === 0)
                    this.PickupNextMessage();
                tIsConnected = true;
                if (tIsConnected !== this.IsConnected) {
                    if (tIsConnected && !tJustLoggedIn) {
                        this.FireEvent(true, "CDE_SETSTATUSMSG", "Connected to " + this.MyHSI.MyServiceUrl + " using " + (this.UsesWebSockets ? "WS" : "REST"), 1);
                    }
                    this.IsConnected = tIsConnected;
                }
                else {
                    if (IsHSIDirty === true) {
                        this.UpdateCallerHSI("ProcessMsgDirty");
                    }
                }
                if (!this.UsesWebSockets)
                    return true;
            }
            return false;
        }

        public Login(credentials: cde.TheCDECredentials) {
            if (this.mLoginSent === true || !credentials)
                return;
            if (!this.MyConfig)
                this.MyConfig = new cde.TheCommConfig(0);
            if (!this.MyHSI.CurrentRSA && !this.MyConfig.DisableRSA) {
                this.DCreds = new cde.TheCDECredentials;
                this.DCreds.QUID = credentials.QUID;
                this.DCreds.QPWD = credentials.QPWD;
                this.DCreds.QToken = credentials.QToken;
                this.FireEvent(true, "CDE_SETSTATUSMSG", "RSA not initialized, yet. Waiting for relay to provide...", 2); //"cdeEngineStatusYellow");
            } else {
                if (this.DCreds && ((this.DCreds.QUID && this.DCreds.QPWD) || this.DCreds.QToken)) {
                    credentials.QToken = this.DCreds.QToken;
                    credentials.QUID = this.DCreds.QUID;
                    credentials.QPWD = this.DCreds.QPWD;
                }
                this.DCreds = null;
                this.FireEvent(true, "CDE_SETSTATUSMSG", "Sending credentials to Relay...", 1);
                if (credentials.QToken && credentials.QToken !== "") {
                    this.TriesTokenLogin = true;
                    this.SendQueued(null, "CDE_TLOGIN" + credentials.QToken, "ContentService", null, null, 1, 1, 1, null, null);
                }
                else if (!credentials.QUID || credentials.QUID === "") {
                    const cred = this.RSAEncrypt(credentials.QPWD, this.MyHSI.CurrentRSA)
                    this.SendQueued(null, "CDE_SETESID" + cred, "ContentService", null, null, 1, 1, 1, null, null);
                } else {
                    const cred = this.RSAEncrypt(`${credentials.QUID}:;:${credentials.QPWD}`, this.MyHSI.CurrentRSA)
                    this.SendQueued(null, "CDE_LOGIN" + cred, "ContentService", null, null, 1, 1, 1, null, null);
                }
                this.mLoginSent = true;
                this.MyConfig.Creds = new cde.TheCDECredentials();
            }
        }

        public SelectMesh(pMeshID: string) {
            this.SendQueued(null, "CDE_MESHSELECT:" + pMeshID, "ContentService", null, null, 1, 1, 1, null, null);
        }

        public RSAEncrypt(text: string, token?: string): string {
            if (this.MyConfig.DisableRSA)
                return text;
            if (!token || token.length === 0)
                token = this.MyHSI.CurrentRSA;
            if (!token || token.length === 0) return text

            const keys = token.split(',')
            const key = new RSAKey()

            key.setPublic(keys[1], keys[0])

            return key.encrypt(text)
        }

        public GetResourceString(pUri: string, pCallback?, pErrocCallback?) {
            this.GetGlobalResource("/ClientBin/" + pUri, null, pCallback, pErrocCallback);
        }

        public GetJSON(pUri: string, pCallback?, pErrorCallback?) {
            this.GetGlobalResource(pUri, null, (pMagic, res) => {
                try {
                    const tJ = JSON.parse(res);
                    pCallback(tJ);
                }
                catch (ex) {
                    if (pErrorCallback)
                        pErrorCallback(pMagic, ex);
                }
            }, (pMagic, err) => {
                if (pErrorCallback)
                    pErrorCallback(pMagic, err);
            });
        }


        public GetGlobalResource(pResource: string, pAddHeader: string, pCallback?, pErrorCallback?) {
            if (window.fetch) {
                const fOptions: Headers = new Headers();
                if (pAddHeader) {
                    const tHeads: string[] = pAddHeader.split(';:;');
                    for (let i = 0; i < tHeads.length; i++) {
                        const tHed: string[] = tHeads[i].split('=');
                        if (tHed.length > 1)
                            fOptions.append(tHed[0], tHed[1]);
                    }
                }
                fetch(pResource, { headers: fOptions, cache: "no-store" }).then(d => {
                    if (d.ok) {
                        d.text().then(txt => {
                            pCallback(pResource, txt);
                        });
                    } else {
                        if (pErrorCallback)
                            pErrorCallback(pResource, d.statusText);
                    }
                }).catch(err => {
                    if (pErrorCallback)
                        pErrorCallback(pResource, err);
                });
            } else {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', pResource);
                xhr.responseType = 'text';
                if (pAddHeader) {
                    const tHeads: string[] = pAddHeader.split(';:;');
                    let tHasAccept = false;
                    for (let i = 0; i < tHeads.length; i++) {
                        const tHed: string[] = tHeads[i].split('=');
                        if (tHed[0] === "Accept")
                            tHasAccept = true;
                        if (tHed.length > 1) {
                            xhr.setRequestHeader(tHed[0], tHed[1]);
                        }
                    }
                    if (!tHasAccept)
                        xhr.setRequestHeader("Accept", "*/*");
                }
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        if (pCallback)
                            pCallback(pResource, xhr.responseText);
                    } else {
                        if (pErrorCallback)
                            pErrorCallback(pResource, xhr.status + ":" + xhr.statusText);
                    }
                };
                xhr.onerror = () => {
                    if (pErrorCallback)
                        pErrorCallback(pResource, xhr.status + ":" + xhr.statusText);
                };
                xhr.send();
            }
        }

        public UpdateCustomSettings(pValues: Array<cde.TheNV>) {
            if (this.MyConfig) {
                for (const key in pValues) {
                    this.MyConfig[key] = pValues[key];
                }
                this.WriteToIDB();
            }
        }

        MyDB: IDBDatabase;
        WriteToIDB() {
            if (!this.MyDB) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'IDB is not ready, yet', 3);
                return;
            }
            this.MyConfig.cdeTIM = new Date();
            const request = this.MyDB.transaction(['CDEJS'], 'readwrite')
                .objectStore('CDEJS')
                .put({ id: 1, config: this.MyConfig }); //whsi: this.MyHSI,

            request.onsuccess = () => {
                //cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'The data has been written successfully', 1);
            };

            request.onerror = () => {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'The data has been written failed', 3);
            }
        }

        DeleteFromIDB() {
            if (!this.MyDB) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:DeleteFromIDB", 'IDB is not ready, yet', 3);
                return;
            }
            const request = this.MyDB.transaction(['CDEJS'], 'readwrite')
                .objectStore('CDEJS')
                .delete(1);

            request.onsuccess = () => {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:DeleteFromIDB", 'The data has been deleted', 1);
            };
        }
    }
}