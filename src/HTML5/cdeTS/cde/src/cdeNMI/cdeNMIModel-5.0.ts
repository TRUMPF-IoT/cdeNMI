// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    //////////////////////////////////////////////////////////////////////////////
    /// Interfaces
    //////////////////////////////////////////////////////////////////////////////

    export interface INMIControl extends cde.ICDEEvents {
        SetTRF(pTRF?: TheTRF, pPropertyBag?: string[]);
        InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean;
        Create(pTargetControl: cdeNMI.INMIControl, pOptions?: TheNMIC): INMIControl;
        GetSetting(pName: string, pDefault?, CompileAsJSON?: boolean); //Gets an incoming setting
        GetProperty(pName: string);                                        //Get a runtime property
        SetProperty(pName: string, pValue);
        SetToDefault(bOnlyIfEmpty: boolean);
        AppendChild(pChild: INMIControl);
        AppendElement(pEle: HTMLElement);
        DeleteControl(tControl: INMIControl);
        RegisterNMIControl(): string;
        SetDataItem(pName: string, pValue: string);
        RegisterThingSetP(pOWN: string, pName: string);
        PostCreate(pTE: INMITileEntry);

        GetContainerElement(): HTMLElement;
        GetElement(): HTMLElement;
        SetElement(pEle: HTMLElement);
        SetInitialSize(tMargin: number);
        SetInitialWidth(tMargin: number): number;
        SetInitialHeight(tMargin: number): number;
        SetTE(pTE: INMITileEntry);
        GetTE(): INMITileEntry;
        GetSegmentWidth(): number;
        SetWidth(pElement: HTMLElement, tW: number, tMargin: number): number;
        SetHeight(pElement: HTMLElement, tW: number, tMargin: number): number;
        IsAChildBigger(tW: number): boolean;
        IsAParentSmaller(tW: number): boolean;

        ApplySkin();
        HookEvents(bDoCapture: boolean);
        ShowFieldContent(pContent: string, pFieldInfo?: cdeNMI.TheFieldInfo, pScreenID?: string): string;
        FindRenderTarget(pTarget: string);

        eventShapeRecognized(sender: INMIControl, pName: string, pScore: number); //Allows to override the ShapeRecognizer event
        DoFireClick(pTargetObj: INMIControl, pEvent?: Event, pPointer?: ThePointer);
        ToggleDrop(doClose: boolean, doForce: boolean);
        OnNUITag(pTag: string, pCookie: string);
        OnLoad(bIsVisible?: boolean);
        OnUnload();
        ReloadData(): boolean;

        MyTarget: INMIControl; //Parent Control
        MyDataView: INMIDataView; //Parent DataView (Form or Table)
        MyParentCtrl: INMIControl; //Parent Control Lecacy
        MyNMIControl: INMIControl;//First SubControl
        MySubControls: Array<TheControlBlock>;
        MyChildren: INMIControl[];
        MyBaseType: cdeControlType;
        MyScreenID: string;
        MyFormID: string;
        MyTRF: cdeNMI.TheTRF;
        MyFieldInfo: cdeNMI.TheFieldInfo;
        MyDataItems: [];
        MyRC: number;
        MyWidth: number;
        MyHeight: number;

        Visibility: boolean;
        IsDirty: boolean;
        WasClicked: boolean;
        HasFacePlate: boolean;
    }

    export interface INMIDataView extends INMIControl {
        DeleteRecord(pDataRow);
        RemoveFormHooks(pMyTableControls: cdeNMI.INMIControl[]);

        GetControlByFldNo(pRowNo: number, pFld: number): INMIControl;
        ReplaceMarcos(tInStr: string, pFormControls: INMIControl[]): string;
        OnLoaded(); //Fires after a dataview was rendered

        MyDataRow: cde.TheDataBase;
        MyFormControls: INMIControl[];
    }

    export interface INMIScreen extends INMIControl {
        SetInitialized(bRegisterOnly: boolean);
        GetInitialized(): boolean;

        CreateScriptInView(pSCR: string);
        CreateHTMLView(pHtml: string);
        AppendContent(pHtml: string);
        Clear(AllKids: boolean);

        ShowPin();
        ShowFullscreen(force: boolean);

        MyRefreshButton: INMIControl;
        MySavePin: INMIControl;
        MyRefreshPin: INMIControl;
        MyShowAllPin: INMIControl;
        MyHostNode: string;
        HasRenderTarget: boolean;
    }

    export interface INMITileEntry extends INMIControl {
        CreateControl(tFldID: string, callback?): INMIControl;

        MyTEContainer: INMIControl;
        MyTEContent: INMIControl;
        MyTELabel: INMIControl;
        DontHideLabel: boolean;
    }

    export interface INMIButton extends INMIControl {
        FireClick(pSender: INMIControl, pEvent?: Event);
    }

    export interface INMIComboBox extends INMIControl {
        ShowComboPicker();
        NeedRefresh: boolean;
    }

    export interface INMIDashboard extends INMIControl {
        SetupDashboard(pScreenID: string): INMIDashboard;
    }

    export interface INMILoginScreen extends INMIScreen {
        ResetDialog();
        SetStatusMsg(pStatusMsg: string, pState: number);
        FinishLogin(bSuccess: boolean, pReason?: string, pUserPref?: cde.TheUserPreferences);
    }

    export interface INMIScreenManager extends INMIControl {
        RegisterScreen(pID: string, pScreen: cdeNMI.INMIScreen, bRegisterOnly: boolean);

        GotoStationHome(bForce: boolean);
        NavigateBack(bForce: boolean);
        TransitToScreenIDX(pIDX: number);
        TransitToScreen(pTargetScreen: string, MustExist?: boolean, DontTryLoad?: boolean, pCookie?: string, pOwnerTable?: string);
        TransitToWaitingScreen(pTargetScreen: string);
        ShowAllScreens();
        RemoveAllScreens();

        RequestPortalScreen(bForce: boolean);
        GetCurrentScreen(): cdeNMI.INMIScreen;
        SetCurrentScreen(pScreen: cdeNMI.INMIScreen, pRowID?: string, pOwnerTable?: string);
        GetScreenByID(pScreenID: string): cdeNMI.INMIScreen;
        GetScreenList(): string;
        GetScreenIndex(): number;
        DeleteScreenByID(pScreenID: string, bDeleteKids: boolean): boolean;
        AreScreensPinned(pScreen: cdeNMI.INMIScreen): number;
        FindPinnedScreen(): cdeNMI.INMIScreen;
        RenumberScreens();

        SetView(pView: TheNMIScene, ClearScreens?: boolean);
        ClearScenes();
        ShowView();

        SetStatusMsg(pStatusMsg: string, pState: number);
        ShowHeader(pShow: boolean);
        SwitchTheme(bToDark: boolean);
        UpdateScreenStatus(mh: string, pIsDown: boolean);

        SetHoloLens();
        GetDeepLink(): string;
        ClearAndGoHome();

        CreateLoginButtonOnly();
        CreateHTMLScreen(pScreenID: string, pHTML: string): INMIScreen;
        CreateScriptScreen(pScreenID: string, pScript: string): INMIScreen;
        CreateIFrameScreen(pScreenID: string, pURL: string): INMIScreen;
        CreateLiveScreen(tModel: cdeNMI.TheScreenInfo): INMIDataView;
        CreateDashboard(tModel: cdeNMI.TheScreenInfo, pInScreenGuid: string): INMIDashboard;
        CreateDataViewScreen(tModel: cdeNMI.TheScreenInfo, pMSG: cde.TSM, pTableName: string, pExtraInfo: string, pScreenID?: string, bForceInitData?: boolean, pRowMID?: string): INMIDataView;

        IsBrowserFullscreen: boolean;
        IsLoaded: boolean;
        DocumentWidth: number;
    }

    export interface INMIEngine extends cde.ICDEEvents {
        GetBaseEngine(): cde.ICDEBaseEngine;
        RequestEngineStatus();

        CheckForUpdates();
        Login(pTargetNode: string, pUID: string, pPWD?: string, pPlatform?: number);
        SelectMesh(pTargetMesh: string);
        ValidateUID(pUID: string): string;

        AddDataToFetch(pData: string);
        CheckDataToFetch(pScreenID: string);
        HasDataToFetch(pToFetch: string): boolean;
        RequestReloadModel(pModelID: string);

        FireLazyLoaded(pScreenID: string, pTableName: string, pMirror);
        LoadTableLazy(pScreenID: string, pTableName: string, pCallback, cookie);
        UnregisterLazyLoader(pScreenID: string, pTableName: string, pCallback);
        GetScreenMeta(pGuid: string, pForceLoad: boolean): boolean;
        GetScene(sceneID: string);

        RegisterIncomingMsg(pCtrl: INMIControl, pID: string, pEngineName?: string);

        RegisterKnownNode(pNodeID: string, pNodeName?: string);
        GetKnownNodeName(pNodeID: string): string;
        IsNodeDown(pNodeID: string): boolean;

        cdeGetScript(pScriptName: string, pCallBack?, cookie?, pTimeout?: number);
        cdeGetResource(pResource: string, pCallBack?, cookie?, pTimeout?: number);
        cdeGetStyle(pResource: string, pCallBack?, cookie?, pTimeout?: number);
        cdeGetImage(pResource: string, pCallBack?, cookie?, pTimeout?: number);

        PublishToNMI(pCommand: string, pPayload?: string, pTargetNode?: string, bNodeIsOwner?: boolean);

        IsConnectedAndReady: boolean;
    }

    export interface INMITestScreen {
        Show();
    }
    export interface INMIToast extends INMIControl {
        ShowToastMessage(pTopic: string, pText?: string, pTime?: number);
        ShowHideToast();
        ShowDebug(pMsg: string);
    }
    export interface INMIToolTip extends INMIControl {
        Show(pCtrlID: string, pToolTipText: string);
        Hide();
    }

    export interface INMICanvasDraw extends INMIControl {
        AddDrawingObject(pObject: TheDrawingObject, id?, drawLater?: boolean);
        DrawCanvasBackground();
        RequestRedraw();
        ResizeCanvas();
        ClearPicture();
        GetPNG(): string;
        GetBGRenderContext(): CanvasRenderingContext2D;
        BeginPolyline(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer);
        ExtendPolylineTo(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer);
        EndPolyline(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer);

        WidthRatio: number;
        HeightRatio: number;
        MyWidth: number;
        MyHeight: number;
    }

    export interface INMITouchOverlay extends INMIControl {
        CurrentControl: INMIControl;
    }

    export interface INMIPopUp extends INMIControl {
        Hide(pStopanimation: boolean);
        Show(pMessageText: string, bShowOkOnly?: boolean, pControl?: INMIControl, pBackColor?: number, sinkYes?, sinkNo?, pCookie?, pParent?): INMIPopUp;
    }

    export interface INMIShapeRecognizer extends INMIControl {
        RecogizeShape(pDrawObject: TheDrawingObject, ScoreMin: number, useProtractor?: boolean);
    }

    export interface INMILocalizer extends cde.TheDataBase {
        SetLCID(pLCID: number);
        GetCurrentLCID(): number;

        T(pKey: string): string;

        GetResources();
        SaveResources();
    }

    export let MyNMIPortal: INMIControl;
    export let MyScreenManager: INMIScreenManager;
    export let MyDemoScreens: INMITestScreen;
    export let MyLoginScreen: INMILoginScreen;

    export const MyNMIModels: cdeNMI.TheScreenInfo[] = new Array<cdeNMI.TheScreenInfo>();
    export const MyNMINUITags: cdeNMI.INMIControl[] = new Array<cdeNMI.INMIControl>();
    export const MyNMIThingEvents: cdeNMI.INMIControl[][] = [];

    export let MyPopUp: INMIPopUp;
    export let MyToolTip: INMIToolTip;
    export let MyToast: INMIToast;
    export let MyEngine: INMIEngine;
    export let MyTouchOverlay: INMITouchOverlay = null;
    export let IsMouseDown = false;
    export let Key13Event = null;
    export let Key27Event = null;
    export let DisableKey36Event = false;
    export let IsInEdit = false;
    export const eTheNMIEngine = "NMIService"; //Main NMI Service Engine
    export let MyShapeRecognizer: INMIShapeRecognizer;

    //////////////////////////////////////////////////////////////////////////////
    /// Enums
    //////////////////////////////////////////////////////////////////////////////

    export enum cdeControlType {
        BaseControl = 0,
        /* NMI Control Types        BaseControl         Done?
          ----------------------------------------------------------------------*/
        SingleEnded = 1, //          ctrlEditBox         YES 
        ComboBox = 2,     //         ctrlComboBox        YES  
        Radio = 3,
        SingleCheck = 4, //          ctrlCheckBox        YES 
        TextArea = 5,   //           ctrlEditBox         YES 
        YesNo = 6,  //               ctrlComboBox          YES NA is option
        //YesNoNa = 7,//               ctrlComboBox      RETIRED
        Time = 8,   //               ctrlComboBox        YES
        TimeSpan = 9, //             ctrlComboBox        YES
        Password = 10, //            ctrlEditBox         YES       
        //SubmitButton = 11,//         ctrlTileButton      YES        RETIRED! USE ctrlTileButton   
        Number = 12, //              ctrlEditBox         YES
        Region = 13, //              ctrlComboBox        
        Country = 14, //             ctrlComboBox       YES
        TrueFalse = 15, //           ctrlComboBox        YES                    
        eMail = 16, //               ctrlEditBox         YES     
        ComboOption = 17,//          ctrlEditBox/ctrlComboBox  YES
        Month = 18,//                ctrlComboBox        YES
        FormButton = 19,//           ctrlTileButton      YES (Form Only) Used for DETAILS, DELETE, etc
        SmartLabel = 20, //          ctrlSmartLabel      YES 
        DateTime = 21,//             ctrlComboBox        YES     
        TileButton = 22,//           ctrlTileButton      YES
        Table = 23,//                ctrlTableView       YES               
        CheckField = 24, //          ctrlCheckField      YES
        RadioGrid = 25,//            
        Screen = 26,//               TheNMIScreen          YES      
        TableCell = 27,//            ctrlTableCell       YES
        TileEntry = 28,//            ctrlTileEntry       YES
        Picture = 29,//              ctrlZoomImage     YES      
        CanvasDraw = 30,//          ctrlCanvasDraw      YES
        URL = 31, //                 ctrlEditBox         YES
        Curreny = 32, //             ctrlEditBox         YES
        Slider = 33, //              ctrlEndlessSlider   YES/FormOnly
        BarChart = 34, //            ctrlBarChart        YES/FormOnly
        Toast = 35, //                                TheToast NO Longer usable by smartcontrols
        TouchDraw = 36, //           ctrlTouchDraw       YES
        Popup = 37,//               ThePopup         NO Longer usable by smartcontrols
        DrawOverlay = 38,//         ctrlDrawOverlay
        //Accordion = 39, //           ctrlAccordion      RETIRED!!!
        DropUploader = 40, //        ctrlDropUploader    YES
        RevealButton = 41,//        ctrlRevealButton    YES
        PinButton = 42,//           ctrlPinButton       YES
        //CenteredTable = 43,//       ctrlCenteredTable   RETIRED!!!
        Dashboard = 44,//            ctrlDashboard       YES
        FormView = 45, //            ctrlFormView        YES
        TouchOverlay = 46, //       ctrlTouchOverlay    YES
        MuTLock = 47, //             ctrlMoTLock         YES
        ProgressBar = 48, //         ctrlProgressBar     YES
        TileGroup = 49, //           ctrlTileGroup       YES
        VideoViewer = 50, //         ctrlVideoViewer     YES/FormOnly
        UserControl = 51, //         ctrlUserControl
        TableRow = 52,
        IPAddress = 53,             // ctrlEditBox          YES
        Shape = 54,                 // ctrlShape            YES
        CollapsibleGroup = 55,      // ctrlCollapsibleGroup YES
        AboutButton = 56,           // ctrlAboutButton
        StatusLight = 57,           // ctrlStatusLight
        FacePlate = 58,               // ctrlFacePlate
        //New controls in 4.1
        LoginScreen = 59,               // TheLoginScreen
        ShapeRecognizer = 60,               // TheShapeRecognizer
        ScreenManager = 61,       //ScreenManager
        LogoButton = 62,            //The Logo Button
        ThingPicker = 63,           //TheThing Picker...old based on ComboBox - soon new control!
        ImageSlider = 64,
        CircularGauge = 65,
        SmartGauge = 66,
        IFrameView = 67,
        PropertyPicker = 68,
        PropertyPickerCtrl = 69,
        ToolTip = 70,
        ComboLookup = 71,
        UserMenu = 72,
        MeshPicker = 73,
        HashIcon = 74,
        CertPicker = 75,
        DeviceTypePicker = 76
    }

    export enum cdeInputEventType {
        UNKOWN = 0,
        MOUSE = 1,
        TOUCH = 2,
        PEN = 3,
        ERASER = 4,
        LEAP = 5,
        KEYBOARD = 6,
        KINECT = 7
    }

    export enum cdeInputEvent {
        IDLE = 0,
        START = 1,
        MOVE = 2,
        END = 3
    }

    export const TheEscapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": '&#39',
    };

    //////////////////////////////////////////////////////////////////////////////
    /// Data Models
    //////////////////////////////////////////////////////////////////////////////
    /**
    ThePlanarImage is used to transfer blobs of Image Information to the C-DEngine NMI UX
    */
    export class ThePlanarImage {
        public Bits;
        public BytesPerPixel: number;
        public Height: number;
        public Width: number;
        public ImageSource: string;
    }



    export class TheScreenTrans {
        public ID: string;
        public DashID: string;
        public IsVisible: boolean;
        public IsPinned: boolean;
        public FldOrder: number;
    }

    export class TheFLDOR {
        public FldOrder: number;
        public PO: string[];
    }

    export class TheFOR extends cde.TheMetaDataBase {
        public ID: string;
        public TileWidth: number;
        public StartGroup: string;
        public Flds: Array<TheFLDOR>;
    }

    export class TheNMIScene extends cde.TheMetaDataBase {
        public FriendlyName: string;
        public IsPublic: boolean;
        public Screens: Array<TheScreenTrans>;
    }

    export class TheNMIResource {
        public ResourceName: string;
        public CallBacks: any[];
        public Cookie: string;
        public IsCreated: boolean;
        public Resource: string;
        public Timeout?: number;
        public TimeoutHandler?;
    }

    export class TheKey {
        public altKey: boolean;
        //public Cchar: string;
        public charCode: number;
        public ctrlKey: boolean;
        public key: string;
        public keyCode: number;
        public locale: string;
        public location: number;
        public metaKey: boolean;
        public repeat: boolean;
        public shiftKey: boolean;
        public which: number;
        public JOYSTICK: number;
        public LEFT: number;
        public MOBILE: number;
        public NUMPAD: number;
        public RIGHT: number;
        public STANDARD: number;

        public eventPhase: number;
        public isTrusted: boolean;
        public returnValue: boolean;
        public timeStamp: number;
        public type: string;


        constructor(pEvt?: KeyboardEvent) {
            if (!pEvt) return;
            this.altKey = pEvt.altKey;
            //this.Cchar = pEvt.char;
            this.charCode = pEvt.charCode;
            this.ctrlKey = pEvt.ctrlKey;
            this.key = pEvt.key;
            this.keyCode = pEvt.keyCode;
            //this.locale = pEvt.locale;
            this.location = pEvt.location;
            this.metaKey = pEvt.metaKey;
            this.repeat = pEvt.repeat;
            this.shiftKey = pEvt.shiftKey;
            this.which = pEvt.which;
            //this.JOYSTICK = pEvt.DOM_KEY_LOCATION_JOYSTICK;
            this.LEFT = pEvt.DOM_KEY_LOCATION_LEFT;
            //this.MOBILE = pEvt.DOM_KEY_LOCATION_MOBILE;
            this.NUMPAD = pEvt.DOM_KEY_LOCATION_NUMPAD;
            this.STANDARD = pEvt.DOM_KEY_LOCATION_STANDARD;
            this.RIGHT = pEvt.DOM_KEY_LOCATION_RIGHT;
            this.eventPhase = pEvt.eventPhase;
            this.isTrusted = pEvt.isTrusted;
            this.returnValue = pEvt.returnValue;
            this.timeStamp = pEvt.timeStamp;
            this.type = pEvt.type;
        }
    }

    export class TheDrawingPoint {
        x: number;
        y: number;
        z: number;
        t: number;

        constructor(x?: number, y?: number) {
            this.x = x ? x : 0;
            this.y = y ? y : 0;
            this.z = 0;
            this.t = 0;
        }

        public toString() {
            return "X,Y,Z,T:" + this.x + "," + this.y + "," + this.z + ":t=" + this.t;
        }
    }

    export class ThePointer {
        public Position: TheDrawingPoint;
        public StartPosition: TheDrawingPoint;
        public AdjPosition: TheDrawingPoint;
        public Ele2DocPosition: TheDrawingPoint;
        public Shift: TheDrawingPoint;
        public Pressure: number;
        public Identifier: number;
        public pointerType: cdeInputEventType;
        public pointerEvent: cdeInputEvent;
        public IsOnObject: boolean;
        public Buttons: number;

        constructor(pEle: HTMLElement, pID: number, pX: number, pY: number, pZ: number, pStroke: number, pPointerType: cdeInputEventType, pPointerEvent?: cdeInputEvent, pButtons?: number) {
            this.Identifier = pID;
            this.Position = new TheDrawingPoint();
            this.Position.x = pX;
            this.Position.y = pY;
            this.Position.z = pZ;
            this.Position.t = pStroke;
            this.Shift = new TheDrawingPoint();
            this.AdjPosition = new TheDrawingPoint();
            this.StartPosition = new TheDrawingPoint();
            this.StartPosition.x = pX;
            this.StartPosition.y = pY;
            this.StartPosition.z = pZ;
            this.StartPosition.t = pStroke;
            this.pointerType = pPointerType;
            if (pPointerEvent)
                this.pointerEvent = pPointerEvent;
            else
                this.pointerEvent = cdeInputEvent.IDLE;
            this.Pressure = pStroke;
            this.Buttons = pButtons;
            this.Ele2DocPosition = ThePointer.ComputeDocumentToElementDelta(pEle);
            this.Update(pEle, this.Position);
        }

        public Update(pControl: HTMLElement, pPointer: TheDrawingPoint) {
            this.Shift.x = pPointer.x - this.Position.x;
            this.Shift.y = pPointer.y - this.Position.y;
            this.Shift.z = pPointer.z - this.Position.z;
            this.Shift.t = pPointer.t - this.Position.t;
            this.Position.x = pPointer.x;
            this.Position.y = pPointer.y;
            this.Position.z = pPointer.z;
            this.Position.t = pPointer.t;
            this.AdjPosition = ThePointer.targetRelativeX(pControl, this.Position, this.Ele2DocPosition);
            this.AdjPosition.t = pPointer.t;
            this.Pressure = pPointer.t;
            this.IsOnObject = true; // ThePointer.IsOnObject(pControl, this.Position, this.Ele2DocPosition); //V4.110: TODO find better algo..does not work right
        }

        public static IsOnObject(tControl: HTMLElement, t: TheDrawingPoint, pDocumentDelta: TheDrawingPoint): boolean {
            const elementMouseIsOver: Element = document.elementFromPoint(t.x, t.y);
            return (elementMouseIsOver === tControl);
        }
        public static targetRelativeX(pControl: HTMLElement, p: TheDrawingPoint, documentToTargetDelta: TheDrawingPoint): TheDrawingPoint {
            const tRes: TheDrawingPoint = new TheDrawingPoint();
            tRes.x = Math.max(0, Math.min(p.x - documentToTargetDelta.x, pControl.offsetWidth));
            tRes.y = Math.max(0, Math.min(p.y - documentToTargetDelta.y, pControl.offsetHeight));
            return tRes;
        }

        //  we send target-relative coordinates to the draw functions
        //  this calculates the delta needed to convert pageX/Y to offsetX/Y because offsetX/Y don't exist in the TouchEvent object or in Firefox's MouseEvent object
        public static ComputeDocumentToElementDelta(theElement: HTMLElement): TheDrawingPoint {
            const tPoint: TheDrawingPoint = new TheDrawingPoint();
            let HasFixedRoot = false;

            for (let offsetElement: HTMLElement = theElement; offsetElement; offsetElement = offsetElement.offsetParent as HTMLElement) {
                tPoint.x += offsetElement.offsetLeft;
                tPoint.y += offsetElement.offsetTop;
                if (offsetElement.className && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform === 0 && (offsetElement.className === 'cdeHeader'))
                    HasFixedRoot = true;
            }

            if (HasFixedRoot) {
                tPoint.x += window.pageXOffset;
                tPoint.y += window.pageYOffset;
            }
            return tPoint;
        }

        ///Need to remain here that Model does not require cdeNMIUtils
        public PathLength(): number {
            return cdeNMI.Vector2Distance(this.StartPosition, this.Position);
        }
        public PathAngle(): number {
            return cdeNMI.Vector2GetAngle(this.StartPosition, this.Position);
        }

        public toString(): string {
            return "ID: " + this.Identifier + "CP:" + this.Position.toString() + " IP:" + this.StartPosition.toString() + " AP:" + this.AdjPosition.toString() + " Type:" + this.pointerType + " Event:" + this.pointerEvent;
        }
    }

    /////////////////////////////////////////////////////////////
    /// NMI ViewModels
    /////////////////////////////////////////////////////////////
    export class TheScreenInfo extends cde.TheMetaDataBase {
        MyDashboard: TheDashboardInfo;
        MyDashPanels: TheDashPanelInfo[];
        MyStorageInfo: TheFormInfo[] = new Array<TheFormInfo>();
        MyStorageMirror = [];
        MyStorageMeta: TheFormInfo[] = new Array<TheFormInfo>();
        ForceReload: boolean;
        NodeName: string;
        RequiredEngines: string[];
        IsLiveForm: boolean;
        IsGenerated: boolean;
    }

    export class TheDashPanelInfo extends cde.TheThing {
        ControlClass: string;
        IsFullSceen: boolean;
        FldOrder: number;
        Flags: number;

        HtmlContent: string;

        Category: string;   //Old V3.2 compat
        PanelTitle: string; //Old V3.2 compat

    }

    export class TheDashboardInfo extends cde.TheThing {
        FldOrder: number;
        DashboardTitle: string;//Old V3.2 compat
        PropertyBag: string[];
    }

    export class TheFieldInfo extends cde.TheThing {
        FormID?: string;
        FldOrder?: number;
        DataItem?: string;
        Flags?: number;  //1=Password;2=edit Enabled;4=Enhanced Editor;8=Hide From Table;16=Hide From Form
        Type?: cdeControlType;

        OldValue?;
        public static NewTFI(pType: cdeControlType, pOrder?: number, pHeader?: string, pFlags?: number, pBag?: Array<string>): TheFieldInfo {
            const tTFI = new TheFieldInfo(pType, null, pHeader, pFlags, null, pBag);
            if (pOrder > 0)
                tTFI.FldOrder = pOrder;
            return tTFI;
        }

        constructor(pType: cdeControlType, pWidth?: number, pHeader?: string, pFlags?: number, pFormID?: string, pBag?: Array<string>) {
            super();
            this.Type = pType;
            if (pBag)
                this.PropertyBag = pBag;
            else
                this.PropertyBag = [];
            if (pHeader)
                this.PropertyBag.push("Title=" + pHeader);
            if (pWidth)
                this.PropertyBag.push("FldWidth=" + pWidth);
            if (pFlags)
                this.Flags = pFlags;
            if (pFormID)
                this.FormID = cde.GuidToString(pFormID);
        }
    }

    export class TheFormInfo extends cde.TheThing {
        AssociatedClassName: string;
        TargetElement: string;
        defDataSource: string;
        OrderBy: string;
        DefaultView = 0;
        IsReadOnly = false;
        IsLiveData = false;
        IsAlwaysEmpty = false;
        IsPostingOnSubmit = false;
        IsUsingAbsolute = false;
        GetFromFirstNodeOnly = false;
        GetFromServiceOnly = false;
        IsGenerated = false;
        FormFields: TheFieldInfo[];
        OwnerEngine: string;
        PropertyBag: string[];

        CurrentRow = 0; //New in 4.1 contains the Row of the table
    }

    export class TheDrawingObject {
        Type: number;   ///1=Rectangle; 2=PolyLine ; 3=Text
        StrokeThickness: number;
        Fill: string;
        Foreground: string;
        Left: number;
        Top: number;
        Width: number;
        Height: number;
        Visibility: boolean;
        ComplexData;
        HasEnded: boolean;
        IsTemp: boolean;
        ID: string;

        constructor(pLeft?: number, pTop?: number) {
            this.Left = pLeft ? pLeft : 0;
            this.Top = pTop ? pTop : 0;
        }
    }

    export class TheComboLookup {
        public Content: string;
        public SrcFld: string;
        public TgtID: string;
        public GroupName: string;
        public ComboControl: cdeNMI.INMIComboBox; // ctrlComboBox; V4.107: no more control references
    }

    export class TheStrokePoint {
        PO: TheDrawingPoint;
        DT: number;
        FL: number;
        PG: string;
        OW: TheDrawingObject;
    }

    export class TheTRF {
        public TableName: string;
        public RowNo: number;
        public FldInfo: TheFieldInfo;
        public RowFilter: string = null;
        public FldName: string = null;
        public ModelID: string = null;
        public RowID: string = null;

        constructor(pTN: string, pRN: number, pFldInfo: TheFieldInfo) {
            this.TableName = pTN;
            this.RowNo = pRN;
            this.FldInfo = pFldInfo;
        }

        public GetHash(): string {
            let ret: string = this.TableName + this.RowNo;
            if (this.FldInfo)
                ret += this.FldInfo.FldOrder;
            return ret;
        }

        public GetDataRow() {
            try {
                if (cdeNMI.MyNMIModels[this.ModelID]) {
                    if (cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName]) {
                        return cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName][this.RowNo];
                    }
                }
            }
            catch (ex) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheTRF:GetDataRow", ex);
            }
            return null;
        }

        public GetMID(): string {
            let tN: string = null;
            try {
                if (cdeNMI.MyNMIModels[this.ModelID]) {
                    if (cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName]) {
                        if (cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName][this.RowNo]) {
                            tN = cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName][this.RowNo].cdeMID;
                        }
                    }
                }
            }
            catch (ex) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheTRF:GetMID", ex);
            }
            if (!tN && this.FldInfo)
                tN = this.FldInfo.cdeMID;
            return tN;
        }

        public GetOwner(): string {
            let tN: string = null;
            try {
                if (cdeNMI.MyNMIModels[this.ModelID]) {
                    if (cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName]) {
                        if (cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName][this.RowNo]) {
                            tN = cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName][this.RowNo].cdeO;
                        }
                    }
                }
            }
            catch (ex) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheTRF:GetMID", ex);
            }
            if (!tN && this.FldInfo)
                tN = this.FldInfo.cdeO;
            return tN;
        }

        public GetNodeID(): string {
            let tN: string = null;
            try {
                if (cdeNMI.MyNMIModels[this.ModelID]) {
                    if (cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName]) {
                        if (cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName][this.RowNo]) {
                            tN = cdeNMI.MyNMIModels[this.ModelID].MyStorageMirror[this.TableName][this.RowNo].cdeN;
                            if (!tN) {
                                // WARNING: this is a fallback if the StorageMirror was not using TheMetaDataBase as base class and will not work Multi-Node! 
                                tN = cdeNMI.MyNMIModels[this.ModelID].cdeN;
                            }
                        }
                    }
                }
            }
            catch (ex) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TheTRF:GetNodeID", ex);
            }
            if (!tN && this.FldInfo)
                tN = this.FldInfo.cdeN;
            return tN;
        }

        public static SetFlagsOnly(pFlags: number): cdeNMI.TheTRF {
            return new cdeNMI.TheTRF("", 0, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.BaseControl, 0, "", pFlags));
        }

        public static FromScreenForm(tModel: cdeNMI.TheScreenInfo, tFormID: string): cdeNMI.TheTRF {
            const tFormInfo: cdeNMI.TheFormInfo = (tModel && tModel.MyStorageMeta && tModel.MyStorageMeta[tFormID]) ? tModel.MyStorageMeta[tFormID] : null;
            const tTRF: TheTRF = new cdeNMI.TheTRF(tFormID, tFormInfo && tFormInfo.CurrentRow ? tFormInfo.CurrentRow : 0, null);
            tTRF.FldInfo = new TheFieldInfo(cdeControlType.BaseControl);
            if (tFormInfo) {
                switch (tFormInfo.DefaultView) {
                    case 0: tTRF.FldInfo.Type = cdeControlType.Table; break;
                    case 1: tTRF.FldInfo.Type = cdeControlType.FormView; break;
                    case 2: tTRF.FldInfo.Type = cdeControlType.IFrameView; break;
                }
                tTRF.FldInfo.cdeO = tFormInfo.cdeO;
                tTRF.FldInfo.cdeN = tFormInfo.cdeN;
                tTRF.FldInfo.cdeMID = tFormInfo.cdeMID;
            }
            return tTRF;
        }

        public static GetTRF(pModelID: string, pDef: cdeNMI.TheTRF): string {
            if (!pDef || !pDef.TableName) return null;

            if (!pModelID)
                pModelID = cde.MyBaseAssets.MyServiceHostInfo.PortalScreen;
            pModelID = cde.GuidToString(pModelID);
            const tModel: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[pModelID];
            if (!tModel || tModel.MyStorageMirror[pDef.TableName]) return null;

            const tRow: number = pDef.RowNo;
            if (pDef.RowFilter) {
                // do nothing
            }
            return tModel.MyStorageMirror[pDef.TableName][tRow][pDef.FldName];
        }
    }


    export class TheNMISettings {
        public TileMargin = 1;
        public IsInEdit = false;
        public IDCounter = 1;
        public StrokeSize = 0.3;
        public DeadPathLength = 40;

        public SupportsMouse = false;
        public SupportsTouch = false;
        public SupportsPointer = false;
        public SupportsTouchForce = false;
        public SupportsTouchForceChange = false;

        mIsScrolling = false;
        mLastScrollTime: number;
        public set IsScrolling(value: boolean) {
            this.mIsScrolling = value;
            if (value === true)
                this.mLastScrollTime = new Date().getTime();
        }
        public get IsScrolling(): boolean {
            const Res: boolean = this.mLastScrollTime && new Date().getTime() < this.mLastScrollTime + 500;
            this.mIsScrolling = cde.CBool(Res);
            return Res;
        }

        constructor() {
            if (typeof Touch !== 'undefined') {
                // In Android, new Touch requires arguments.
                try {
                    if (Touch.prototype.hasOwnProperty('force') || 'force' in new Touch(null)) {
                        this.SupportsTouchForce = true;
                    }
                } catch (e) {
                    //ignored
                }
            }
            this.SupportsTouch = 'ontouchstart' in window.document && this.SupportsTouchForce;
            this.SupportsMouse = 'onmousemove' in window.document && !this.SupportsTouch;
            this.SupportsPointer = 'onpointermove' in window.document;
            this.SupportsTouchForceChange = 'ontouchforcechange' in window.document;
        }
    }
    export const MyNMISettings: cdeNMI.TheNMISettings = new TheNMISettings();

    export class TheNavHistory {
        ScreenID: string;
        ScrolPos: number;
    }

    export class TheFlashCache {
        public Value: string;
        public Stamp: number;
        public Exp: number;

        public static AddCache(pName: string, pValue: string, exp?: number) {
            if (cdeNMI.MyFlashCache[pName]) {
                cdeNMI.MyFlashCache[pName].Value = pValue;
                cdeNMI.MyFlashCache[pName].Stamp = Math.ceil((new Date()).getTime() - (new Date(2014, 4, 1)).getTime());
                return;
            }
            const tSt: cdeNMI.TheFlashCache = new cdeNMI.TheFlashCache();
            tSt.Value = pValue;
            tSt.Stamp = Math.ceil((new Date()).getTime() - (new Date(2014, 4, 1)).getTime());
            if (exp)
                tSt.Exp = exp;
            else
                tSt.Exp = 3000;
            cdeNMI.MyFlashCache[pName] = tSt;
        }
        public static GetCache(pName: string): string {
            if (!cdeNMI.MyFlashCache[pName]) return null;
            if (Math.ceil((new Date()).getTime() - (new Date(2014, 4, 1)).getTime()) - cdeNMI.MyFlashCache[pName].Stamp > cdeNMI.MyFlashCache[pName].Exp) {
                //cdeNMI.MyFlashCache.splice(cdeNMI.MyFlashCache.findIndex(cdeNMI.MyFlashCache[pName]), 1);   //V4.110:TODO ES5/ES6 incompat Test this NOT SUPPORTED IN ES5
                return null;
            }
            return cdeNMI.MyFlashCache[pName].Value;
        }
        public static FlushCache() {
            cdeNMI.MyFlashCache = [];
        }
    }
    export let MyFlashCache: TheFlashCache[] = [];

    export class TheNodeInfo extends cde.TheMetaDataBase {
        public NodeName: string;
        public LastPing: number;
        public IsDown: boolean;
    }

    export class TheControlBlock {
        public TargetID: string;
        public MyControl: INMIControl;
        public OnIValueChanged;
    }
    export const MyTCBs: TheControlBlock[][] = [];


    export class TheFaceWait {
        public TRF: TheTRF;
        public TargetControl: INMIControl;
        public HTML: string;
    }

    export class TheNMIC {
        public TRF?: TheTRF;
        public PreInitBag?: string[];
        public ScreenID?: string;
        public PostInitBag?: string[];
        public Cookie?;
    }

    export class TheComboOption {
        public label: string;
        public text: string;
        public value: string;
        public id: number;
        public group: string;
        public disabled: boolean;
        public selected: boolean;
        public html: string;
        public choices: TheComboOption[];
    }

    export class ThePB {
        public static GetPropNameFromBag(pBag: string, bDontTrim?: boolean) {
            let ePos: number = pBag.indexOf("=");
            if (ePos < 0) {
                ePos = pBag.length;
            }
            if (cde.CBool(bDontTrim))
                return pBag.substring(0, ePos);
            return pBag.substring(0, ePos).trim();
        }

        public static RemoveProperty(pBag: string[], pName: string) {
            if (pBag && pBag.length > 0) {
                for (let jj = 0; jj < pBag.length; jj++) {
                    const ePos: number = pBag[jj].indexOf("=");
                    if (ePos >= 0) {
                        const tPropName: string = pBag[jj].substring(0, ePos).trim();
                        if (tPropName === pName) {
                            pBag.splice(jj, 1);
                            return;
                        }
                    }
                }
            }
        }

        public static UpdateProperty(pBag: string[], pName: string, pValue: string) {
            if (!pBag)
                return;
            if (pBag && pBag.length > 0) {
                for (let jj = 0; jj < pBag.length; jj++) {
                    const ePos: number = pBag[jj].indexOf("=");
                    if (ePos >= 0) {
                        const tPropName: string = pBag[jj].substring(0, ePos).trim();
                        if (tPropName === pName) {
                            pBag[jj] = pName + "=" + pValue;
                            return;
                        }
                    }
                }
            }
        }

        public static GetValueFromBagByName(pBag: string[], pName: string, bDontTrim?: boolean): string {
            if (pBag && pBag.length > 0) {
                for (let jj = 0; jj < pBag.length; jj++) {
                    const ePos: number = pBag[jj].indexOf("=");
                    if (ePos >= 0) {
                        const tPropName: string = pBag[jj].substring(0, ePos).trim();
                        const tProValue: string = (bDontTrim === true ? pBag[jj].substring(ePos + 1) : pBag[jj].substring(ePos + 1).trim());
                        if (tPropName === pName)
                            return tProValue;
                    }
                }
            }
            return null;
        }
        // Has to stay any for any field with a PropertyBag
        public static ConvertPropertiesFromBag(tFldInfo, pBag?: string[]) {
            if (!tFldInfo) return;
            if (!tFldInfo.PropertyBag)
                tFldInfo.PropertyBag = [];
            for (let jj = 0; jj < tFldInfo.PropertyBag.length; jj++) {
                this.ConvertBagToSettings(tFldInfo, tFldInfo.PropertyBag[jj]);
            }
            if (pBag) {
                for (let jjj = 0; jjj < pBag.length; jjj++) {
                    this.ConvertBagToSettings(tFldInfo, pBag[jjj]);
                }
            }
        }

        private static ConvertBagToSettings(pFldInfo, pBagString: string) {
            if (!pFldInfo || !pBagString) return;
            let ePos: number = pBagString.indexOf("=");
            let bHasValue = true;
            if (ePos < 0) {
                ePos = pBagString.length;
                bHasValue = false;
            }
            let tPropName: string = pBagString.substring(0, ePos).trim();
            if (tPropName === "Value") tPropName = "iValue";
            if (bHasValue) {
                const tProValue: string = pBagString.substring(ePos + 1).trim();
                if (tPropName === 'Flags' || tPropName === 'FldOrder' || tPropName === 'ACL')
                    pFldInfo[tPropName] = cde.CInt(tProValue);
                else
                    pFldInfo[tPropName] = tProValue;
            } else
                pFldInfo[tPropName] = true;
        }

        public static SetPropertiesFromBag(pCtrl: cdeNMI.INMIControl, pBag: string[], pRow?, pIsLive?: boolean, pIsInTable?: boolean) {
            if (!pBag || !pCtrl) return;
            for (let jj = 0; jj < pBag.length; jj++) {
                let ePos: number = pBag[jj].indexOf("=");
                let bHasValue = true;
                if (ePos < 0) {
                    ePos = pBag[jj].length;
                    bHasValue = false;
                }
                let tPropName: string = pBag[jj].substring(0, ePos).trim();
                if (tPropName === "Value") tPropName = "iValue";
                if (cde.CBool(pIsInTable) && (tPropName === "TileWidth" || tPropName === "TileLeft" || tPropName === "TileTop" || tPropName === "IsAbsolute"))
                    continue;
                if (pCtrl.MyBaseType === cdeControlType.TileEntry && (tPropName.toLowerCase() === "onthingevent"))
                    continue;
                let tProValue = "";
                try {
                    if (bHasValue) {
                        tProValue = pBag[jj].substring(ePos + 1).trim();
                        cdeNMI.ThePB.SetRawProperty(pCtrl, tPropName, tProValue, pRow, pIsLive);
                    }
                    else {
                        pCtrl.SetProperty(tPropName, true);
                    }
                }
                catch (except) {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "ThePB:SetPropertyFromBag", "SetPropertyFromBag failed to SetP on " + tPropName + " to " + tProValue);
                }
            }
        }

        public static SetRawProperty(pCtrl: cdeNMI.INMIControl, tPropName: string, pProValue: string, pRow?, pIsLive?: boolean) {
            if (!tPropName) return;
            let tProValue = pProValue;
            if (!tProValue) tProValue = "";
            switch (tPropName.toLowerCase()) {
                case "onthingevent":
                    try {
                        let tEvParts: string[];
                        if (pIsLive)
                            tEvParts = tProValue.split(';');
                        else
                            tEvParts = cdeNMI.GenerateFinalString(tProValue, pRow).split(';');
                        pCtrl.RegisterThingSetP(tEvParts[0], tEvParts[1]);
                    }
                    catch (e) {
                        //ignored
                    }
                    break;
                default:
                    if (tPropName !== "HTML" && tPropName !== "OnClick" && tProValue.indexOf("<%") >= 0 && tProValue.indexOf("%>") >= 0) {
                        tProValue = cdeNMI.GenerateFinalString(tProValue, pRow);
                        pCtrl.SetDataItem(tPropName, tProValue);
                    }
                    else {
                        if (tProValue && tProValue.indexOf('%') >= 0) {
                            tProValue = cdeNMI.GenerateFinalString(tProValue, pRow, null, true);
                        }
                        pCtrl.SetProperty(tPropName, tProValue);
                    }
                    break;
            }
        }

        public static GetSetting(pFieldInfo: TheFieldInfo, pName: string) {
            let res = null;
            if (pFieldInfo) {
                res = pFieldInfo[pName];
                if (!res && pFieldInfo.PropertyBag)
                    res = cdeNMI.ThePB.GetValueFromBagByName(pFieldInfo.PropertyBag, pName);
            }
            return res;
        }
    }

    export class TheLanguageResource {
        LCID = 0;
        MyResources = {};
    }

    export class TheLocalizer extends cde.TheDataBase implements INMILocalizer {

        LocalResources: TheLanguageResource = new TheLanguageResource();
        mRequestedLCID = 0;

        public SetLCID(pLCID: number) {
            if (pLCID !== this.LocalResources.LCID) {
                this.mRequestedLCID = pLCID;
                if (pLCID === 1033) {
                    this.LocalResources = new TheLanguageResource();
                    this.LocalResources.LCID = pLCID;
                }
                else {
                    this.GetResources();
                    return;
                }
            }
            this.FireEvent(true, "OnLCIDChanged", this.LocalResources.LCID);
        }
        public GetCurrentLCID(): number {
            return this.LocalResources.LCID;
        }

        public GetResources() {
            if (this.mRequestedLCID > 0 && this.mRequestedLCID !== 1033) {
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.cdeGetResource("Lang/NMIlang" + cde.CStr(this.mRequestedLCID) + ".json", (c, t) => { this.SetResources(t); }, null, 3000);
                    return;
                }
            }
            this.FireEvent(true, "OnLCIDChanged", this.LocalResources.LCID);
        }

        SetResources(pT: string) {
            if (pT && pT !== "TIMEOUT" && pT !== "Not Found") {
                try {
                    const pDATA: TheLanguageResource = JSON.parse(pT);
                    if (this.mRequestedLCID === pDATA.LCID) {
                        for (const idx in pDATA.MyResources) {
                            this.LocalResources.MyResources[idx] = pDATA.MyResources[idx];
                        }
                        this.LocalResources.LCID = pDATA.LCID;
                    }
                } catch (e) {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:SetResource", "failed with " + e + ":" + e.stack);
                }
            }
            this.FireEvent(true, "OnLCIDChanged", this.LocalResources.LCID);
        }

        public SaveResources() {
            const tS: string = JSON.stringify(this.LocalResources);
            if (cde.MyContentEngine)
                cde.MyContentEngine.SaveFile(tS, "NMIlang" + this.LocalResources.LCID + ".json", "application/json", false);
        }

        public T(pKEY: string) {
            if (typeof pKEY !== "string" || !pKEY || pKEY === "")
                return "";
            pKEY = pKEY.replace('&nbsp;', ' ');
            if (this.LocalResources.MyResources[pKEY])
                return cdeNMI.IconFAShim(this.LocalResources.MyResources[pKEY]);
            else {
                if (cde.MyBaseAssets.MyServiceHostInfo.RedPill && !pKEY.startsWith("(Waiting for control #"))
                    this.LocalResources.MyResources[pKEY] = pKEY;// pKEY;
                return cdeNMI.IconFAShim(pKEY);
            }
        }
    }
    export const TL: INMILocalizer = new TheLocalizer();
}