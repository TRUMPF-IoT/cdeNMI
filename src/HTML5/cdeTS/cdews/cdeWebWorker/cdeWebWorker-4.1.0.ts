// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

//interface SharedWorkerGlobalScope {
//    onconnect: (event: MessageEvent) => void;
//}

const MyWorkerContext: SharedWorkerGlobalScope = self as any;
//const MyWorkerContext: Worker = self as any;

namespace cde {
    export function CInt(pInVal): number {
        if (isNaN(pInVal) || !pInVal) return 0;
        let retVal = 0;
        try {
            retVal = parseInt(pInVal);
        }
        catch (ex) {
            //ignored
        }
        if (isNaN(retVal)) return 0;
        return retVal;
    }

    export function CDbl(pInVal): number {
        if (isNaN(pInVal) || !pInVal) return 0;
        let retVal = 0;
        try {
            retVal = parseFloat(pInVal);
        }
        catch (ex) {
            //ignored
        }
        if (isNaN(retVal)) return 0;
        return retVal;
    }

    export function CBool(inStr): boolean {
        if (this.IsNotSet(inStr)) return false;
        if (typeof (inStr) === "boolean") return inStr;
        switch (inStr.toString().toLowerCase()) {
            case "true": case "yes": case "1": case "on": return true;
            default: return false;
        }
    }

    export function IsNotSet(pInVal) {
        return pInVal === undefined || pInVal === null || pInVal === "";
    }

    export function GetSubstringIndex(pInStr: string, pSubStr: string, pOccurance: number): number {
        let times = 0;
        let index = 0;

        while (times < pOccurance && index !== -1) {
            index = pInStr.indexOf(pSubStr, index + pSubStr.length);
            times++;
        }
        return index;
    }

    export function DateToString(inDate: Date): string {
        const month = inDate.getMonth() + 1;
        const day = inDate.getDate();
        const year = inDate.getFullYear();
        const hours = inDate.getHours();
        const minutes = inDate.getMinutes();
        let ampm = "AM";
        if (hours > 11) {
            ampm = "PM";
        }
        return month + "/" + day + "/" + year + " " + hours + ":" + minutes + " " + ampm;
    }

    export class TheCoreQueueContent {
        JMSG: string;
        TOPIC: string;
        ENG: string;
        RQP: string;

        constructor(pEng: string, pTopic: string, pMsg: cde.TheDeviceMessage[]) {
            this.ENG = pEng;
            this.JMSG = JSON.stringify(pMsg);
            this.TOPIC = pTopic;
        }
    }

    export class TheISBConnect {
        NPA: string;    //Next possible address - required for http(s) to use as the next path
        FNI: string;    //First Node ID - contains the DeviceID of the first node the browser is connected to
        MCS: string;     //UNUSED: Main Configuration screen - coming in a future version
        PS: string;      //Portal Screen - the Dashboard the user wants to see first (containst the data and meta model)
        SSC: string;    //Start Screen - the individual screen inside the dashboard to be set as the start screen
        AT: string;     //Application Title to be displayed in the header
        SID: string;    //Current Session ID
        QUI: string;    //UserName to use for auto logon - this is only supported with special permissions
        PWD: string;    //Password to use for auto login -
        ERR: string;    //Error Message if applicable
        UNA: string;    //RETIRED: use QUI instead (was user name)
        LCI: number;    //LCID of the user for auto logon
        WSP: number;    //WebSocket Port - if the relay supports websockets this contains the WS port
        TLS: boolean;   //is TLS enforced - if true, the connection must use SSL/TLS

        //New in 4.1
        ADR: string;   //Admin Role: if set the user has to set the administrator password first
        VER: number;    //Current Version of TheISBConnect. undefined in 4.0 but higher 4.0 starting with 4.1
    }

    export class TheTimeouts {
        HeartBeat = 30;
        PickupRate = 250;
        InitRate = 100;
        HeartBeatMissed = 4;
        PickupRateDelay = 1;
        WsTimeOut = 5000;

        public EnterAdrenalin() {
            this.HeartBeat = 5;
            this.HeartBeatMissed = 30;
        }
        public NormalHeartRate() {
            this.HeartBeat = 30;
            this.HeartBeatMissed = 4;
        }
        public EnterSleepMode() {
            this.HeartBeat = 100;
            this.HeartBeatMissed = 3;
        }
    }

    export class TSM {
        TIM: Date;
        ORG: string;
        SID: string;
        FID: number;
        UID: string;

        FLG: number;
        QDX: number;
        CST: string;
        OWN: string;
        LVL: number;
        ENG: string;
        TXT: string;
        PLS: string;
        PLB;
        GRO: string;

        constructor(pEng: string) {
            this.ENG = pEng;
            this.TIM = new Date();
            this.ORG = "";
            this.FID = cdeWorker.MsgSendCounter++;
            this.PLB = null;
            this.QDX = 5;
            this.LVL = 4;
            this.CST = "";
            this.UID = "";
            this.OWN = "";
            this.GRO = "";
        }
        public static GetOriginator(pTSM: TSM): string {
            if (!pTSM.ORG) return "";
            const t: string[] = pTSM.ORG.split(';');
            return t[0];
        }
    }

    export class TheProcessMessage {
        Topic: string;
        CurrentUser;
        Message: cde.TSM;
        LocalCallback;

        constructor(pTopic: string, pTSM: cde.TSM) {
            this.Topic = pTopic;
            this.Message = pTSM;
        }
    }

    export class TheDeviceMessage {
        TOP: string;
        MSG: cde.TSM;
        CNT: number;
        DID: string;
        FID: string;
        SID: string;
        NPA: string;
        RSA: string;
    }

    export class TheCDECredentials {
        QUID = "";
        QPWD = "";
        QToken: string = null;
    }

    export class TheMeshPicker {
        cdeMID: string;
        cdeCTIM: Date;
        cdeEXP: number;
        cdePRI: number;
        cdeAVA: number;
        cdeN: string;
        MeshHash: string;
        NodeNames: Array<string>;
        HomeNode: string;
    }

    export class TheUserPreferences {
        ShowClassic: boolean;
        ScreenParts: string[];
        ThemeName: string;
        LCID: number;
        ShowToolTipsInTable: boolean;
        SpeakToasts: boolean;
        Transforms: string;
        CurrentUserName: string = null;
        PortalScreen: string = null;
        StartScreen: string = null;
        HideHeader = false;
    }

    export class TheNV {
        public Name: string;
        public Value: string;
    }

    export class TheCommConfig {
        TO?: TheTimeouts;
        port?: number;
        uri?: string;
        wsuri?: string;
        host?: string;
        useTLS?: boolean;
        Creds?: TheCDECredentials;
        IsWSHBDisabled?: boolean;
        cdeTIM: Date;

        NoISB = false;
        DisableRSA = false;
        RequestPath: string = null;
        KeepSessionAlive = false;      //if false, MyConfig will be deleted on logout

        constructor(pWSTimeOut: number) {
            this.port = 80;
            this.host = null;
            this.Creds = null;
            this.useTLS = false;
            this.cdeTIM = new Date();
            this.IsWSHBDisabled = false;
            this.TO = new TheTimeouts();
            if (pWSTimeOut > 0)
                this.TO.WsTimeOut = pWSTimeOut;
        }
    }

    //Worker stuff here

    export class TheWHSI {
        CurrentRSA: string = null;              //Only Direct caller relevant
        IsConnected = false;           //Only Direct caller relevant
        CallerCount = 0;                //Only Direct caller relevant
        InitialNPA: string = null;

        HasAutoLogin = false;          //Outbound Only
        FirstNodeID = '';               //Outbound Only
        AdminPWMustBeSet = false;      //Outbound only
        AdminRole: string = null;
        LastPortalScreen: string = null;        //If a user hit F5 this will contain the last portal screen used
        LastStartScreen: string = null;         //If a user hit F5 this will contain the last start screen used

        UserPref: cde.TheUserPreferences;       //Outbound Only (User Pref)

        MyServiceUrl = '';              //Must Be synced with caller
        IsUserLoggedIn = false;        //Must Be synced with caller
    }


    export class cdeWorker {
        constructor(port: MessagePort) {
            if (port)
                this.AddPort(port);
        }

        DCreds: cde.TheCDECredentials = null;
        MyConfig: cde.TheCommConfig = null;             //Only Direct caller relevant
        MyHSI: cde.TheWHSI = new TheWHSI();

        public static MsgSendCounter = 0;             //Global Safe (worker use only)
        NMIVersion = 4.0;               //Global Safe (worker use only)
        MyStationID = "";               //Global Safe (worker use only)

        IsPosting = false;
        IsRetrying = false;
        MyWebSockets: WebSocket = null;
        MyFallbackServiceUrl = '';

        IsWSConnected = false;
        IsConnectionDown = false;

        UsesWebSockets = false;
        mLoginSent = false;
        HasStarted = false;
        TriesTokenLogin = false;

        HealthCounter = 0;
        HBCounter = 0;
        DeadCounter = 0;

        Pre4209SID: string = null;

        MyHeartBeatMonitor;
        MyCoreQueue: cde.TheDeviceMessage[] = new Array<cde.TheDeviceMessage>();

        get IsConnected(): boolean { return this.MyHSI.IsConnected; }
        set IsConnected(value) {
            if (this.MyHSI.IsConnected !== value) {
                this.MyHSI.IsConnected = value;
                this.UpdateHSI();
                this.FireEvent(true, "CDE_CONN_CHANGED", value);
            }
        }

        UpdateHSI() {
            this.MyHSI.HasAutoLogin = (this.MyConfig && this.MyConfig.Creds !== null);
            this.MyHSI.CallerCount = this.MyPorts.length;
            this.WriteToIDB();
        }

        public SetTargetRelay(pTarget: string): boolean {
            if (this.MyHSI.IsConnected)   //don't start twice
                return;
            //.log("SetTargetRelay:" + pTarget);
            let tParts: string[];
            try {
                tParts = pTarget.split(';:;');
                let t = null;
                t = new URL(tParts[0]);
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
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SetTargetRelay", "Config was set", 1);
                return true;
            } catch (ex) {
                const tErr = tParts[0] + " is not a valid Url";
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SetTargetRelay", tErr, 2);
                this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 2);
            }
            return false;
        }

        public SetConfig(pConfig: cde.TheCommConfig) {
            if (this.MyHSI.IsConnected)   //don't start twice
                return;
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
            //this.UpdateCallerHSI();
        }

        public StartCommunication(pConfig?: cde.TheCommConfig) {
            if (this.MyHSI.IsConnected || this.HasStarted)   //don't start twice
            {
                if (this.MyHSI.IsConnected && this.HasStarted)
                    this.FireEvent(true, "CDE_CONN_CHANGED", true);
                return;
            }

            this.IsConnectionDown = false;
            if (!this.MyDB) {
                const req = indexedDB.open('cdeDB', 1);
                req.onupgradeneeded = (ev: Event) => {
                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "In Upgrade Needed", 1);
                    this.MyDB = (ev.target as IDBOpenDBRequest).result;
                    if (!this.MyDB.objectStoreNames.contains('CDEJS')) {
                        this.MyDB.createObjectStore('CDEJS', { keyPath: 'id' });
                    }
                    this.StartCommPhase2(pConfig);
                };
                req.onsuccess = (ev: Event) => {
                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Open Success", 1);
                    this.MyDB = (ev.target as IDBOpenDBRequest).result;

                    const transaction = this.MyDB.transaction(['CDEJS']);
                    const objectStore = transaction.objectStore('CDEJS');
                    const request = objectStore.get(1);
                    request.onerror = () => {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Read of Idx1 failed", 3);
                        this.StartCommPhase2(pConfig);
                    };

                    request.onsuccess = () => {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", "Read Success", 1);
                        if (request.result) {
                            //this.MyHSI = request.result.whsi;
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
                            this.StartCommPhase2(pConfig);
                        } else {
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:message", 'No data record', 2);
                            this.StartCommPhase2(pConfig);
                        }
                    };
                };
                req.onerror = (ev: Event) => {
                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:error", "Error:" + ev, 3);
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
                    this.GetGlobalResource(isbEndpoint, null, (isbEnd: string, isbstr: string) => {
                        const isb: TheISBConnect = JSON.parse(isbstr);
                        if (isb.ERR) {
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartCommunication", "MyISBConnect returned: " + isb.ERR, 3);
                            this.FireEvent(true, "CDE_NO_CONNECT", "ISBConnect returned " + isb.ERR + ". Verify ISBConnect is allow on relay.");
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
                                this.MyFallbackServiceUrl = `${tscheme}://${this.MyConfig.host}:${this.MyConfig.port}`;
                            }
                            this.MyConfig.RequestPath = isb.NPA;
                            this.MyHSI.InitialNPA = isb.NPA;
                            this.MyHSI.FirstNodeID = isb.FNI;
                            if (isb.ADR) {
                                this.MyHSI.AdminPWMustBeSet = true;
                                this.MyHSI.AdminRole = isb.ADR;
                            }
                            if (cde.CDbl(isb.VER) > 4)
                                this.NMIVersion = cde.CDbl(isb.VER);
                            else
                                this.NMIVersion = 4.0;
                            this.DoStartComm();
                        }
                    }, (isbend, error) => {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartCommunication", "MyISBConnect failed! :" + error, 3);
                        this.FireEvent(true, "CDE_NO_CONNECT", "ISBConnect failed. Verify ISBConnect is allow on relay.");
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
            const bStartup = this.StartupWS();
            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:DoStartComm", "Connect in final stage HB monitoring: " + bStartup);

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
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNode:StartCommunication", reason, 3);
                                this.EndSession(reason);
                            }
                        }
                    }
                }
                if (this.UsesWebSockets || ((this.HealthCounter % this.MyConfig.TO.PickupRateDelay) === 0 || this.MyCoreQueue.length > 0))
                    this.SendNextMessage(null);
                IsStillWorking = false;
            }, this.MyConfig.TO.PickupRate);
            this.FireEvent(true, "CDE_COMM_STARTED", null);
        }

        public SendTSM(tTSM: cde.TSM, pTopic?: string, pTarget?: string, pSender?: string) {

            if (this.MyCoreQueue.length > 0 && (pTopic === "CDE_PICKUP" || !pTopic))
                return;

            if ((tTSM.FLG & 4096) !== 0) {
                tTSM.PLS = this.RSAEncrypt(tTSM.PLS); //ATTENTION: PLS Can exceed encryptable size of token!
            }
            tTSM.ORG = this.MyStationID + (pSender ? ":" + pSender : "");

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

            //console.log("SendTSM Topic:" + pTopic);

            const tDevMsg: cde.TheDeviceMessage = new cde.TheDeviceMessage();
            tDevMsg.TOP = pTopic ? pTopic : tTSM.ENG;
            tDevMsg.MSG = tTSM;
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
            //console.log("SendQueued Topic:" + pTopic);
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
            tTSM.ORG = this.MyStationID + (pSender ? ":" + pSender : "");

            const tDevMsg: cde.TheDeviceMessage = new cde.TheDeviceMessage();
            tDevMsg.TOP = pTopic;
            tDevMsg.MSG = tTSM;
            this.MyCoreQueue.push(tDevMsg);
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


        PickupNextMessage() {
            const tDevMsg: cde.TheDeviceMessage = new cde.TheDeviceMessage();
            tDevMsg.TOP = "";
            tDevMsg.MSG = null;
            this.MyCoreQueue.push(tDevMsg);
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
                    uri = this.MyFallbackServiceUrl + encodeURI(tRPath);
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
                    if (fetch) {
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
                                    this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SendNextMessage", "Message Parse Error:" + tErr);
                                    this.PostError(MyQueuedMsg, "parse failed", pRetryPath);
                                }
                            }
                            else if (xhr.status !== 200) {
                                const tStat: string = "Message returned: " + xhr.status + " msg:" + xhr.statusText;
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:SendNextMessage", tStat);
                                this.PostError(MyQueuedMsg, tStat, pRetryPath);
                            }
                        };
                        xhr.onerror = () => {
                            const tStat: string = "Message returned: " + xhr.status + " msg:" + xhr.statusText;
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:xhrError", tStat);
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
            let tUri: string = this.MyConfig.wsuri;
            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartupWS", "WS connect to: " + tUri);
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
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "Strange Response from WServer:" + args.data);
                        }
                        else {
                            let bIsLarge = false;
                            if (args.data.length > 500000) {
                                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "Very large Telegram received:" + args.data.length);
                                bIsLarge = true;
                            }
                            const tMsg: cde.TheDeviceMessage[] = JSON.parse(args.data);
                            if (tMsg && tMsg.length > 0) {
                                for (let i = 0; i < tMsg.length; i++) {
                                    if (!tMsg[i].MSG && tMsg[i].TOP !== "") {
                                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onMessage", tMsg[i].TOP);
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
                                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:OnMessage", "ORG:" + cde.TSM.GetOriginator(tMsg[i].MSG) + "TXT: " + tMsg[i].MSG.TXT);
                                    this.ProcessDeviceMessage(tMsg[i], true);
                                }
                            }
                        }
                    }
                    catch (e) {
                        this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebComm:StartWS", "Error during OnMessage:" + e);
                    }
                };
                this.MyWebSockets.onclose = () => {
                    if (this.UsesWebSockets) {
                        this.UsesWebSockets = false;
                        if (this.IsWSConnected) {
                            const tErr: string = cde.DateToString(new Date()) + (this.mLoginSent ? " Relay refused login and closed connection" : " WS Communication was closed. You will need to login again");
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onclose", tErr);
                            this.EndSession(tErr);
                        } else {
                            const tErr: string = cde.DateToString(new Date()) + (this.mLoginSent ? " a connection could not be established" : " WS Communication was closed. You will need to login again");
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onclose", tErr);
                            this.EndSession(tErr);
                        }
                    }
                }
                this.MyWebSockets.onerror = () => {
                    if (this.UsesWebSockets) {
                        this.UsesWebSockets = false;
                        if (this.IsWSConnected) {
                            const tErr: string = cde.DateToString(new Date()) + " WS Communication was interrupted. You will need to login again";
                            this.FireEvent(true, "CDE_SETSTATUSMSG", tErr, 3);
                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "StartUpWS:onerror", tErr);
                            this.EndSession(tErr);
                        }
                    }
                }
                return true;
            }
            return false;
        }

        EndSession(pReason: string) {
            if (cde.CBool(this.IsConnectionDown))
                return;
            clearInterval(this.MyHeartBeatMonitor);
            this.IsConnectionDown = true;
            this.IsConnected = false;
            this.MyHSI = new cde.TheWHSI();
            this.MyConfig = null;
            this.IsRetrying = false;
            this.HasStarted = false;
            this.DeleteFromIDB();
            this.FireEvent(true, "CDE_SESSION_ENDED", pReason);
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
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "PostError", tErr);
                this.EndSession(tErr);
            }
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
                    if (!this.MyHSI.FirstNodeID) {
                        this.MyHSI.FirstNodeID = cde.TSM.GetOriginator(tMsg.MSG);
                    }
                    IsHSIDirty = true;
                    if (this.DCreds) {
                        this.Login(this.DCreds);
                        this.DCreds = null;
                    }
                }
                this.DeadCounter = 0;
                if (tMsg.DID && tMsg.DID !== "" && !this.MyStationID) {
                    this.MyStationID = tMsg.DID;
                    IsHSIDirty = true;
                }

                let tIsConnected = this.IsConnected;
                let tJustLoggedIn = false;
                if (tMsg.TOP === 'ERR:CDE_LOGIN_FAILURE') {
                    this.MyHSI.IsUserLoggedIn = false;
                    this.mLoginSent = false;
                    this.MyConfig.Creds = null;
                    this.FireEvent(true, "CDE_LOGIN_EVENT", false, "Relay rejected credentials", null);
                    tJustLoggedIn = true;
                    IsHSIDirty = true;
                    this.EndSession("Relay rejected credentials - Login failed");
                }
                else if (tMsg.TOP === 'ERR:CDE_MESHSELECT_FAILURE') {
                    this.MyHSI.IsUserLoggedIn = false;
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
                                            this.FireEvent(true, "CDE_NEW_LOGENTRY", "Login:Illegal User Preferences received");
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
                            this.MyHSI.IsUserLoggedIn = true;
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

        RSAEncrypt(text: string, token?: string): string {
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



        public GetResourceStringAsync(pUri: string, pAddHeader?: string) {
            this.GetGlobalResource("/ClientBin/" + pUri, pAddHeader, (retMagic, res) => {
                this.FireEvent(true, "GRS_" + retMagic, res);
            }, (pMagic, err) => {
                this.FireEvent(true, "GRS_ERROR_" + pMagic, err);
            });
        }

        public GetGlobalResourceAsync(pUri: string, pAddHeader?: string) {
            this.GetGlobalResource(pUri, pAddHeader, (pMagic, res) => {
                this.FireEvent(true, "GGR_" + pMagic, res);
            }, (pMagic, err) => {
                this.FireEvent(true, "GGR_ERROR_" + pMagic, err);
            });
        }

        public GetJSONAsync(pUri: string, pAddHeader?: string) {
            this.GetGlobalResource(pUri, pAddHeader, (pMagic, res) => {
                try {
                    const tJ = JSON.parse(res);
                    this.FireEvent(true, "GJ_" + pMagic, tJ);
                }
                catch (ex) {
                    this.FireEvent(true, "GJ_ERROR_" + pMagic, ex);
                }
            }, (pMagic, err) => {
                this.FireEvent(true, "GJ_ERROR_" + pMagic, err);
            });
        }

        public GetGlobalResource(pResource: string, pAddHeader: string, pCallback?, pErrorCallback?) {
            if (fetch) {
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

        public OnMessage(ev: MessageEvent) {
            try {
                const message: any = ev.data;
                if (message.length > 1) {
                    switch (message[0]) {
                        case "SetTargetRelay":
                            this.SetTargetRelay.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "SetConfig":
                            this.SetConfig.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "StartCommunication":
                            this.StartCommunication.apply(this, Array.prototype.slice.call(message, 1));
                            break;

                        case "SendQueued":
                            this.SendQueued.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "UpdateCustomSettings":
                            this.UpdateCustomSettings.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "Subscribe":
                            {
                                const tTSM: cde.TSM = new cde.TSM("ContentService");
                                tTSM.TXT = "CDE_SUBSCRIBE";
                                tTSM.PLS = message[1];
                                if (this.Pre4209SID && this.Pre4209SID !== "")
                                    tTSM.PLS += "@" + this.Pre4209SID;
                                this.SendTSM(tTSM, null, this.MyHSI.FirstNodeID);
                            }
                            break;
                        case "Unsubscribe":
                            {
                                const tTSM: cde.TSM = new cde.TSM("ContentService");
                                tTSM.TXT = "CDE_UNSUBSCRIBE";
                                tTSM.PLS = message[1];
                                if (this.Pre4209SID && this.Pre4209SID !== "")
                                    tTSM.PLS += "@" + this.Pre4209SID;
                                this.SendTSM(tTSM, null, this.MyHSI.FirstNodeID);
                            }
                            break;
                        case "SendTSM":
                            this.SendTSM.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "SendToFirstNode":
                            this.SendTSM(message[1], "CDE_SYSTEMWIDE", this.MyHSI.FirstNodeID);
                            break;
                        case "SendToOriginator":
                            if (message.length > 2) {
                                this.SendTSM(message[2], "CDE_SYSTEMWIDE", message[1].ORG);
                            }
                            break;
                        case "SendToNode":
                            if (message.length > 2)
                                this.SendTSM(message[2], "CDE_SYSTEMWIDE", message[1]);
                            break;

                        case "Logout":
                            this.EndSession(message[1]);
                            break;

                        case "GetWHSI":
                            this.UpdateCallerHSI("GETWHSI");
                            break;
                        case "Login":
                            this.Login.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "SelectMesh":
                            this.SelectMesh.apply(this, Array.prototype.slice.call(message, 1));
                            break;

                        case "GetJSON":
                            this.GetJSONAsync.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "GetResourceString":
                            this.GetResourceStringAsync.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                        case "GetGlobalResource":
                            this.GetGlobalResourceAsync.apply(this, Array.prototype.slice.call(message, 1));
                            break;
                    }
                }
            }
            catch (ee) {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeWebWorker:OnMessage", ee, 3);
            }
        }

        FireEvent(async: boolean, pEvent: string, ...param) {
            for (let i = 0; i < this.MyPorts.length; i++)
                this.MyPorts[i].postMessage([pEvent, this.MyHSI, ...param]);
        }

        public UpdateCallerHSI(pSource: string) {
            this.UpdateHSI();
            this.FireEvent(true, "CDE_NEW_LOGENTRY", "UpdateHSI", pSource, 1);
            this.FireEvent(true, "CDE_UPDATE_HSI", pSource);
        }

        public AddPort(newPort: MessagePort) {
            this.MyPorts.push(newPort);
        }
        MyPorts: Array<MessagePort> = [];
        MyDB: IDBDatabase;
        WriteToIDB() {
            if (!this.MyDB) {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'IDB is not ready, yet', 3);
                return;
            }
            this.MyConfig.cdeTIM = new Date();
            const request = this.MyDB.transaction(['CDEJS'], 'readwrite')
                .objectStore('CDEJS')
                .put({ id: 1, config: this.MyConfig }); //whsi: this.MyHSI,

            request.onsuccess = () => {
                //this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'The data has been written successfully',1);
            };

            request.onerror = () => {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:WriteToIDB", 'The data has been written failed', 3);
            }
        }

        DeleteFromIDB() {
            if (!this.MyDB) {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:DeleteFromIDB", 'IDB is not ready, yet', 3);
                return;
            }
            const request = this.MyDB.transaction(['CDEJS'], 'readwrite')
                .objectStore('CDEJS')
                .delete(1);

            request.onsuccess = () => {
                this.FireEvent(true, "CDE_NEW_LOGENTRY", "IndexedDB:DeleteFromIDB", 'The data has been deleted', 1);
            };
        }
    }
}

var MyWorker: cde.cdeWorker;
MyWorkerContext.onconnect = function (e) {
    const port: MessagePort = e.ports[0];
    port.addEventListener('message', (ev: MessageEvent) => {
        MyWorker.OnMessage(ev);
    });
    port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
    if (!MyWorker) {
        MyWorker = new cde.cdeWorker(port);
    }
    else {
        MyWorker.AddPort(port);
        MyWorker.UpdateCallerHSI("startup");
    }
}