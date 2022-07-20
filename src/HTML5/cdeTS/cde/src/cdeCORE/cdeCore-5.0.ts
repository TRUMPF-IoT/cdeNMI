// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

namespace cde {
    //////////////////////////////////////////////////////////////////////////////
    /// Interfaces
    //////////////////////////////////////////////////////////////////////////////

    export interface ICDEEvents {
        HasEvent(pName: string): boolean;                   //Verify that an event is registered
        RegisterEvent(pName: string, pCallBackSink);   //Register a new event
        UnregisterEvent(pName: string, pCallback);     //Unregister an event. If pcallback is null, ALL callbacks of the event will be removed
        FireEvent(FireAsync: boolean, ...params);    //Fires an even. if FireAsynch is true, the event will fire and immediately return (not yet implemented)
    }

    export interface ICDECommChannel extends ICDEEvents {
        SetTargetRelay(pTarget: string): boolean;           //Sets the Target Relay URL format: http(s)://<host>:<port>
        SetConfig(pConfig: cde.TheCommConfig);              //Sets a custom config
        StartCommunication(pConfig?: cde.TheCommConfig);    //Starts the Communication. If pConfig is not used, SetConfig or SetTargetRelay must be called before

        SendQueued(pOwner: string, pTopic: string, pEngineName: string, pTXT: string, pPLS: string, pFLG: number, pQDX: number, pLVL: number, pTarget: string, pGRO?: string, pSender?: string);
        Subscribe(pTopics: string);
        Unsubscribe(pTopics: string);
        SendTSM(tTSM: cde.TSM, pTopic?: string, pTarget?: string, pSender?: string);        //ISB: Sends Message to first node
        SendToFirstNode(TargetMessage: cde.TSM);            //ISB: Sends Message to first node
        SendToOriginator(sourceMessage: cde.TSM, TargetMessage: cde.TSM, IncludeLocalNode: boolean);
        SendToNode(tOrg: string, TargetMessage: cde.TSM, IncludeLocalNode: boolean);

        Logout();                                           //Ends the communication and terminates the connection
        Login(credentials: cde.TheCDECredentials);          //Sends the credentials to the target relay - fires "CDE_LOGIN_EVEN" when login was done
        SelectMesh(pTargetMesh: string);                    //Sends a message back to the First node with a desired Mesh ID
        UpdateCustomSettings(pValues: Array<cde.TheNV>);    //Adds or updates custom settings to be stored in the IndexedDB

        //The next 4 are synchronous and not supported in the Web Worker
        RSAEncrypt(text: string, token?: string): string;   //Encrypts the text either against the token provided or the token created during the Communication Startup
        IsConnected: boolean;                               //Is the CommChannel connected to a relay
        IsReady: boolean;                                   //Is the CommChannel connected and has a valid RSA token (ready for login)
        HasAutoLogin: boolean;                              //Does the CommChannel has preset Credentials
        ForceDisconnect: boolean;                           //Can be set by higher levels to make sure IsConnected = false

        GetResourceString(pResource: string, pCallback?, pErrorCallback?); //Gets a Local Resource (string) from the Local (NMI) ClientBin folder
        GetGlobalResource(pResource: string, pAddHeader: string, pCallback?, pErrorCallback?);
        GetJSON(pUri: string, pCallback?, pErrorCallback?);
        //Events Fired:
        //(CDE_SETSTATUSMSG, statusText, level): Status of the CommChannel for potential UX or Log output
        //(CDE_LOGIN_EVENT, success, successText, ScreenIDs): fires success "false" if login failed, true on success. successText contains information on failure, ScreenIDs is an array of ScreenMids to load after login
        //(CDE_ENGINE_GONE, engineName): fires when a Post to a Relay failed. The engineName contains the last ENG that was posted
        //(CDE_INCOMING_MSG, processMessage): fires incoming messages to upstream clients. This is the ONLY message interface for incoming messages
    }

    export interface ICDEBaseEngine extends ICDEEvents {
        GetEngineName(): string;

        SendInitialize();
        SendSubscribe();
        SaveFile(pContent, pName: string, pMime: string, IsBinary: boolean);
        RSAEncrypt(text: string, token?: string): string;

        FireEngineIsReady(pIsReady: boolean);

        PublishCentral(pTXT: string, pPLS?: string);
        PublishToService(pTXT: string, pPLS?: string);
        PublishToFirstNode(pTXT: string, pPLS?: string);
        PublishToNode(pNodeID: string, pTXT: string, pPLS?: string, pGRO?: string);
        PublishToOwner(pOwner: string, pTXT: string, pPLS?: string, pTarget?: string, pGRO?: string, pSender?: string);
        PublishToOriginator(pTSM: cde.TSM, pTXT: string, pPLS?: string, pSender?: string);

        EngineState: TheEngineState;
        RegisterIncomingMessage(pCallback);
        //Events Fired:
        //(EngineReady, bIsReady): Fired when the engine is ready with all subscriptions
        //(IncomingMessage, pProgressMessage): Fires when the engine receives a new Incoming Message
    }


    export function IsIE(): boolean {
        if (!navigator) return false;   //NodeJS should return false here
        const ua: string = navigator.userAgent;
        /* MSIE used to detect old browsers and Trident used to newer ones*/
        return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
    }

    export function cdeEval(pCode: string, ...param) {
        if (pCode.substr(0, 1) === "[") {
            return JSON.parse(pCode.replace(/'/g, "\""));
        }
        if (pCode.substr(0, 2) === "([" || pCode.substr(0, 2) === "({") {
            const tJ = pCode.substr(1, pCode.length - 2);
            return JSON.parse(tJ.replace(/'/g, "\""));
        }
        return Function('"use strict";return (' + pCode + ')')(...param);
    }

    /**
 C-DEngine Base Class for all Databound classes
*/
    export class TheDataBase implements ICDEEvents {
        cdeMID: string;
        cdeCTIM: Date;
        cdeEXP: number;
        cdePRI: number;
        cdeAVA: number;
        cdeN: string;

        private MyEvents: [][] = [];

        public HasEvent(pName: string): boolean {
            if (this.MyEvents && this.MyEvents[pName]) return true;
            return false;
        }

        public RegisterEvent(pName: string, pCallBackSink) {
            if (!this.MyEvents[pName])
                this.MyEvents[pName] = [];
            if (this.MyEvents[pName].indexOf(pCallBackSink) < 0)
                this.MyEvents[pName].push(pCallBackSink);
        }

        public UnregisterEvent(pName: string, pCallback?) {
            if (this.MyEvents[pName]) {
                if (!pCallback)
                    this.MyEvents[pName] = [];
                else {
                    for (let i = this.MyEvents[pName].length - 1; i >= 0; i--) {  // STEP 1
                        if (this.MyEvents[pName][i] === pCallback) {              // STEP 2
                            this.MyEvents[pName].splice(i, 1);                 // STEP 3
                            break;
                        }
                    }
                }
            }
        }

        public FireEvent(FireAsync: boolean, pEvtName: string, ...params) {
            if (this.MyEvents[pEvtName]) {
                for (let mh = 0; mh < this.MyEvents[pEvtName].length; mh++) {
                    if (this.MyEvents[pEvtName][mh]) {
                        try {
                            if (typeof this.MyEvents[pEvtName][mh] === "string") {
                                const EventName = pEvtName;
                                const Parameter = params.length > 1 ? params[1] : null;
                                const PropertyName = params.length > 2 ? params[2] : null;

                                if (params.length < 3) {
                                    if (cde.MyBaseAssets.MyServiceHostInfo.DebugLevel > 3)
                                        debugger;
                                }
                                const tJS: string = this.MyEvents[EventName][mh];
                                if (tJS.substr(0, 3) === "JS:")
                                    cdeEval(tJS.substr(3));
                                else {
                                    cde.MyBaseAssets.FireEvent(FireAsync, "OnStringEvent", tJS, this, Parameter, PropertyName, params);
                                }
                            }
                            else {
                                if (params.length > 0 && params[0] instanceof cde.TheProcessMessage)
                                    this.MyEvents[pEvtName][mh](this, params[0]);
                                else
                                    this.MyEvents[pEvtName][mh](this, ...params);
                            }
                        } catch (error) {
                            if (pEvtName !== "CDE_NEW_LOGENTRY")
                                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeCore:FireEvent", "FireEvent:" + error + "<br>" + error.stack);
                        }
                    }
                }
            }
        }
    }

    /**
 Extension to the C-DEngine Base Class for all Databound classes including Meta Data (i.e. for Table and Form descriptions)
*/
    export class TheEngineState extends TheDataBase {
        public ClassName: string;
        public IsInitialized = false;
        public IsEngineScoped = false;
        public IsEngineReady = false;

        constructor() {
            super();
        }
    }

    export class TheMetaDataBase extends TheDataBase implements ICDEEvents {
        cdeM: string;
        cdeO: string;
        cdeF: number;
        cdeA: number;
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
            this.FID = MyBaseAssets.MyServiceHostInfo.MsgSendCounter++;
            this.PLB = null;
            this.QDX = 5; //Sync with Full CDE
            this.LVL = 4; //Sync with Full CDE
        }
        public static GetOriginator(pTSM: TSM): string {
            if (!pTSM.ORG) return "";
            const t: string[] = pTSM.ORG.split(';');
            return t[0];
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

    export class TheMeshPicker extends cde.TheDataBase {
        MeshHash: string;
        NodeNames: Array<string>;
        HomeNode: string;
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

    export class cdeP extends TheMetaDataBase {
        cdeT: number;
        cdeE: number;
        cdeFOC: number;
        Name: string;
        Value;
        OldValue;
    }

    export class TheThing extends TheMetaDataBase {
        PropertyBag: string[];
        HasLiveObject: boolean;
        IsUXInitialized: boolean;
        IsInitialized: boolean;
    }

    export class TheSegment {
        public Outer: string;
        public Inner: string;
    }

    export class TheProcessMessage {
        Topic: string;
        CurrentUser;
        Message: cde.TSM;

        constructor(pTopic: string, pTSM: cde.TSM) {
            this.Topic = pTopic;
            this.Message = pTSM;
        }
    }

    export class TheNV {
        public Name: string;
        public Value: string;
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
        RequestPath: string = null;
        DisableRSA = false;
        KeepSessionAlive = false;

        constructor(ptimout: number) {
            this.port = 80;
            this.host = null; ///"127.0.0.1";
            this.Creds = null;
            this.useTLS = false;
            this.cdeTIM = new Date();
            this.IsWSHBDisabled = false;
            this.TO = new TheTimeouts();
            if (ptimout > 0)
                this.TO.WsTimeOut = ptimout;
        }
    }

    export class TheCDECredentials {
        QUID = "";
        QPWD = "";
        QToken: string = null;
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

    export class TheServiceHostInfo {
        //Embedded Objects
        IsEmbedded = false;                //Should be set to true if the NMI is hosted in another Site
        ResourcePath = '';                  //Additional path if NMI resources are merged with other sites resources (i.e. /NMI/ loads all resources under <hostingurl>/NMI/*)
        WsTimeOut = 0;
        DisableRSA = false;
        UToken = "";

        //Target Service Depending Settings
        RequestGeoLocation = false;
        EnablePinLogin = false;
        DoAllowAnonymous = false;
        LoginDisallowed = false;
        DisableWebWorker = false;
        IsUsingUserMapper = false;
        AllowSetScopeWithSetAdmin = false;
        WebPlatform = 0;
        RedPill = false;
        LastSID = "";       //4.209: No longer Used!!
        KnownRelays = "";
        AutoConnectRelay: string = null;
        NMIVersion = 4.0;

        WasPortalRequested = false;
        PortalPage = "";
        ShowClassic = false;
        ScreenManagerClass: string = null;
        ShowLogInConsole = false;
        ApplicationTitle = "";
        MainConfigScreen = "";
        TileSize = 78;
        TileScale = 1.0;
        InputSize = 60;

        ScreenClassName = "cdeBrowserTop";
        WasInitialScreenVisible = false;
        ///Used by Convenience Apps
        IsLiteTheme = false;
        UPref = "";

        DoesRequireConfiguration = false;
        MyStationID = "";
        InitUserPref: string;
        HasInternetAccess = false;
        IsAppHosted = false;
        IsWebHosted = false;

        MsgSendCounter = 0;
        DebugLevel = 0;
        MyWSServiceUrl: string = null;          //WebSockets URL of the FirstNode - can be emtpy if websockets are disabled

        PortalReset = null;

        mPortalScreen: string = null;
        set PortalScreen(value: string) { this.mPortalScreen = value; }
        get PortalScreen(): string {
            if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.MyBaseAssets.MyCommStatus.UserPref.PortalScreen)
                return cde.MyBaseAssets.MyCommStatus.UserPref.PortalScreen;
            return this.mPortalScreen;
        }

        mStartScreen: string = null;
        set StartScreen(value: string) { this.mStartScreen = value; }
        get StartScreen(): string {
            if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.MyBaseAssets.MyCommStatus.UserPref.StartScreen)
                return cde.MyBaseAssets.MyCommStatus.UserPref.StartScreen;
            return this.mStartScreen;
        }

        mCurrentLCID: number = null;
        set CurrentLCID(value: number) { this.mCurrentLCID = value; }
        get CurrentLCID(): number {
            if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.CInt(cde.MyBaseAssets.MyCommStatus.UserPref.LCID) > 0)
                return cde.MyBaseAssets.MyCommStatus.UserPref.LCID;
            return this.mCurrentLCID;
        }

        mHideHeader: boolean = null;
        set HideHeader(value: boolean) { this.mHideHeader = value; }
        get HideHeader(): boolean {
            if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.CBool(cde.MyBaseAssets.MyCommStatus.UserPref.HideHeader) === true)
                return cde.CBool(cde.MyBaseAssets.MyCommStatus.UserPref.HideHeader);
            return this.mHideHeader;
        }

        mAdminPWMustBeSet: boolean = null;
        set AdminPWMustBeSet(value: boolean) { this.mAdminPWMustBeSet = value; }
        get AdminPWMustBeSet(): boolean {
            if (cde.CBool(cde.MyBaseAssets.MyCommStatus.AdminPWMustBeSet))
                return true;
            return this.mAdminPWMustBeSet;
        }

        mAdminRole: string = null;
        set AdminRole(value: string) { this.mAdminRole = value; }
        get AdminRole(): string {
            if (cde.MyBaseAssets.MyCommStatus.AdminRole)
                return cde.MyBaseAssets.MyCommStatus.AdminRole;
            return this.mAdminRole;
        }

        //FirstNodeID: string = '';
        mFirstNodeID: string = null;
        set FirstNodeID(value: string) { this.mFirstNodeID = value; }
        get FirstNodeID(): string {
            if (cde.MyBaseAssets.MyCommStatus.FirstNodeID)
                return cde.MyBaseAssets.MyCommStatus.FirstNodeID;
            return this.mFirstNodeID;
        }

        get IsUserLoggedIn(): boolean {         //True if a user is currently logged in
            if (cde.MyBaseAssets.MyCommStatus)
                return cde.MyBaseAssets.MyCommStatus.IsUserLoggedIn;
            else
                return false;
        }
        //Moved to MyCommStatus! - can lead to back-incompat if used by a 3rd party extension - all set to read only
        //UserPref: cde.TheUserPreferences;
        //MyServiceUrl: string = '';
        //RequestPath: string = '';

        get CurrentUserName(): string {
            if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.MyBaseAssets.MyCommStatus.UserPref.CurrentUserName)
                return cde.MyBaseAssets.MyCommStatus.UserPref.CurrentUserName;
            return "";
        }
    }

    export class TheWHSI {
        CurrentRSA: string = null;              //CurrentRSA Key used for RSA Encryption
        IsConnected = false;           //True if the Communication was established
        CallerCount = 0;                //Amount of SharedWorker ports
        InitialNPA: string = null;

        HasAutoLogin = false;          //True if the credentials have been set before the Login Dialog appeard (AutoLogin)
        FirstNodeID: string = null;             //NodeID of FirstNode after connect
        AdminPWMustBeSet = false;      //True if FirstNode requires AdminPWToBe Set (browser is unscoped and cannot send any telegrams except "SET_ADMIN_PWD")
        AdminRole: string = null;               //Role of the Current User (Not used, yet)
        LastPortalScreen: string = null;        //If a user hit F5 this will contain the last portal screen used
        LastStartScreen: string = null;         //If a user hit F5 this will contain the last start screen used

        MyServiceUrl: string = null;            //Http URL of the FirstNode - can be used for DeepLinks

        UserPref: cde.TheUserPreferences = null;       //User Preferences (see below) coming in with the CDE_LOGIN_EVENT
        get IsUserLoggedIn(): boolean {         //True if a user is currently logged in
            if (this.UserPref)
                return true;
            else
                return false;
        }
    }

    export class TheBaseAssets extends TheDataBase {
        public MyServiceHostInfo: TheServiceHostInfo = new TheServiceHostInfo();
        public MyCommStatus: TheWHSI = new TheWHSI(); //CommChannel Relevant Status
        public MyEngines: ICDEBaseEngine[] = new Array<ICDEBaseEngine>();
        ///Used by Convenience Apps
        public static IsConnectionDown(): string {
            return (!cde.MyCommChannel || !cde.MyCommChannel.IsConnected).toString();
        }
        get HasAutoLogin(): boolean { return (cde.MyCommChannel && cde.MyCommChannel.HasAutoLogin === true); }
    }

    export class TheUserPreferences extends cde.TheDataBase {
        ShowClassic: boolean;
        ScreenParts: string[];
        ThemeName: string;
        LCID: number;
        ShowToolTipsInTable: boolean;
        SpeakToasts: boolean;
        Transforms: string;
        CurrentUserName: string = null;
        PortalScreen: string = null;            //PortalScreen of the NMI (Must be a dashboard)
        StartScreen: string = null;             //StartScreen of the NMI (a screen within the PortalScreen Dashboard)
        HideHeader = false;            //True if the FirstNode wants to see no Header in the browser
    }

    //From CommonUtils to reduce references
    export function FixupPath(pInPath: string): string {
        if (!pInPath || pInPath.length === 1) return "";
        let tPa = "";
        if (cde.MyBaseAssets.MyServiceHostInfo.ResourcePath) {
            tPa = cde.MyBaseAssets.MyServiceHostInfo.ResourcePath;
            if (pInPath.substr(0, 1) !== "/")
                tPa += "/";
        }
        if (cde.MyBaseAssets.MyCommStatus.MyServiceUrl && document.location.origin !== cde.MyBaseAssets.MyCommStatus.MyServiceUrl) {
            if (tPa.length > 0)
                tPa = `${cde.MyBaseAssets.MyCommStatus.MyServiceUrl}/${tPa}`;
            else
                tPa = cde.MyBaseAssets.MyCommStatus.MyServiceUrl;
        }
        if ((tPa.length > 0 && tPa.substr(tPa.length - 1, 1) !== "/") && !pInPath.startsWith("/") && !pInPath.toLowerCase().startsWith("http"))
            tPa += "/";
        return tPa + pInPath;
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

    export function IsNotSet(pInVal) {
        return pInVal === undefined || pInVal === null || pInVal === "";
    }

    export function CStr(pInVal): string {
        if (!pInVal)
            return "";
        else
            return pInVal.toString();
    }

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

    export function CBool(inStr): boolean {
        if (this.IsNotSet(inStr)) return false;
        if (typeof (inStr) === "boolean") return inStr;
        switch (inStr.toString().toLowerCase()) {
            case "true": case "yes": case "1": case "on": return true;
            default: return false;
        }
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

    export function GetSubstringIndex(pInStr: string, pSubStr: string, pOccurance: number): number {
        let times = 0;
        let index = 0;

        while (times < pOccurance && index !== -1) {
            index = pInStr.indexOf(pSubStr, index + pSubStr.length);
            times++;
        }
        return index;
    }

    export function GuidToString(InGuid: string): string {
        if (!InGuid) return "";
        let OutGuid: string = InGuid.replace('{', '').replace('}', '');
        while (OutGuid.indexOf('-') > 0)
            OutGuid = OutGuid.replace('-', '');
        return OutGuid.toUpperCase();
    }

    export function DeleteAllCookies() {
        const cookies = document.cookie.split("; ");
        for (let c = 0; c < cookies.length; c++) {
            const d = window.location.hostname.split(".");
            while (d.length > 0) {
                const cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
                const p = location.pathname.split('/');
                document.cookie = cookieBase + '/';
                while (p.length > 0) {
                    document.cookie = cookieBase + p.join('/');
                    p.pop();
                }
                d.shift();
            }
        }
    }

    export const MyBaseAssets: TheBaseAssets = new cde.TheBaseAssets();
    export let MyContentEngine: cde.ICDEBaseEngine = null;
    export let MyCommChannel: cde.ICDECommChannel = null;
    export const MyEventLogger: cde.TheMetaDataBase = new TheMetaDataBase();
}

