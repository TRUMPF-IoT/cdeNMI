// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

using nsCDEngine.BaseClasses;
using nsCDEngine.Communication;
using nsCDEngine.Engines;
using nsCDEngine.Engines.NMIService;
using nsCDEngine.Engines.ThingService;
using nsCDEngine.Security;
using nsCDEngine.ViewModels;
using System;
using System.Collections.Generic;
using System.IO;

namespace NMIService
{
    public partial class TheNMIHtml5RT : ThePluginBase, ICDENMIPlugin
    {
        internal static readonly Guid eNMIPortalDashboard = new Guid("{E7DA71A1-496F-4B15-A8AB-969526341C7B}");
        internal static readonly Guid eNMIDashboard = new Guid("{FAFA22FF-96AC-42CF-B1DB-7C073053FC39}");
        internal static readonly Guid eActivationAndStatusDashGuid = new Guid("{1CF9A525-0126-4189-AF41-18C3609E5743}");

        /// <summary>
        /// 
        /// </summary>
        /// <param name="pBase">The C-DEngine is creating a Host for this engine and hands it to the Plugin Service</param>
        public override void InitEngineAssets(IBaseEngine pBase)
        {
            MyBaseEngine = pBase;
            MyBaseEngine.SetEngineName(GetType().FullName);
            MyBaseEngine.SetEngineType(GetType());
            MyBaseEngine.SetFriendlyName("The NMI Runtime Service");
            MyBaseEngine.AddCapability(eThingCaps.NMIEngine);
            MyBaseEngine.AddCapability(eThingCaps.NMIControls);
            MyBaseEngine.AddCapability(eThingCaps.MustBePresent);
            MyBaseEngine.SetPluginInfo("This service provides a rich graphical UX - the NMI - based on HMTL5", 0, null, "toplogo-150.png", "C-Labs", "https://www.c-labs.com", new List<string> { "NMI Extension" });
            MyBaseEngine.SetCDEMinVersion(4.008);
            MyBaseEngine.SetEngineService(true);
            MyBaseEngine.GetEngineState().IsAllowedUnscopedProcessing = TheBaseAssets.MyServiceHostInfo.IsCloudService;
            MyBaseEngine.GetEngineState().IsAcceptingFilePush = true;
            MyBaseEngine.SetEngineID(new Guid("{4D6E5FE8-338E-4B3E-B98D-0FFFEB62FE63}"));
        }

        private TheFieldInfo mRequestKeyFld;
        private TheFieldInfo mFormLabelField;

        public virtual void RegisterNMIControls()
        {

        }

        public void RenderMainFrameTemplate(Guid TemplateID)
        {
            if (TemplateID != Guid.Empty)
                MyMainFrameHtml = RenderMainFrameHtml(TemplateID);
        }

        public override bool CreateUX()
        {
            if (mIsUXInitCalled) return false;

            mIsUXInitCalled = true;
            if (!MyBaseEngine.GetEngineState().IsService)
            {
                TheBaseAssets.MySYSLOG.WriteToLog(7678, new TSM(eEngineName.NMIService, "NMI Not service exiting", eMsgLevel.l3_ImportantMessage));
                mIsUXInitialized = true;
                return true;
            }
            TheBaseAssets.MySYSLOG.WriteToLog(7678, TSM.L(eDEBUG_LEVELS.OFF) ? null : new TSM(eEngineName.NMIService, "Registering MetaInformation NMI", eMsgLevel.l3_ImportantMessage));
            MyBaseEngine.SetDashboard(eNMIDashboard.ToString());

            string tMeta = TheBaseAssets.MyServiceHostInfo.GetMeta("/NMIPORTAL");
            tMeta += "<meta name=\"msapplication-task\" content=\"name=The NMI Portal;action-uri=" + TheBaseAssets.MyServiceHostInfo.GetPrimaryStationURL(false) + "/NMIPortal;icon-uri=/" + TheBaseAssets.MyServiceHostInfo.favicon_ico + "\" />";

            TheNMIEngine.AddPageDefinition(new ThePageDefinition(new Guid("{D4987E90-CCE0-4888-AE88-79D7BD173900}"), "/NMIPORTAL", TheBaseAssets.MyServiceHostInfo.ApplicationTitle, "nmiportal.html", Guid.Empty)
            {
                WPID = 10,
                IncludeCDE = true,
                RequireLogin = true,
                PortalGuid = eNMIPortalDashboard,
                AddHeader = tMeta,
                MobileConstrains = 480,
                AdminRole = "NMIADMIN",
                BrandPage = true,
                IncludeHeaderButtons = true,
                IsLiteTheme = false
            });
            tMeta = TheBaseAssets.MyServiceHostInfo.GetMeta("/LNMIPORTAL");
            tMeta += "<meta name=\"msapplication-task\" content=\"name=The NMI Portal;action-uri=" + TheBaseAssets.MyServiceHostInfo.GetPrimaryStationURL(false) + "/LNMIPortal;icon-uri=/" + TheBaseAssets.MyServiceHostInfo.favicon_ico + "\" />";
            TheNMIEngine.AddPageDefinition(new ThePageDefinition(new Guid("{D4987E90-CCE0-4888-AE88-79D7BD173901}"), "/LNMIPORTAL", TheBaseAssets.MyServiceHostInfo.ApplicationTitle, "nmiportal.html", Guid.Empty)
            {
                WPID = 10,
                IncludeCDE = true,
                RequireLogin = true,
                PortalGuid = eNMIPortalDashboard,
                AddHeader = tMeta,
                MobileConstrains = 480,
                AdminRole = "NMIADMIN",
                BrandPage = true,
                IncludeHeaderButtons = true,
                IsLiteTheme = true
            });

            if (MyBaseEngine.GetEngineState().IsService)
            {
                TheDashboardInfo tDash = TheNMIEngine.GetDashboardById(eNMIDashboard);

                TheFormInfo tInf = TheNMIEngine.GetFormById(new Guid("{6EE8AC31-7395-4A80-B01C-D49BE174CFC0}"));
                TheNMIEngine.AddFields(tInf, new List<TheFieldInfo>
                {
                    {new TheFieldInfo() {FldOrder = 10, DataItem = "FriendlyName", Type = eFieldType.SingleEnded, Header = "Friendly Name", FldWidth = 3}},
                    {new TheFieldInfo() {FldOrder = 13, DataItem = "ClassName", Type = eFieldType.SingleEnded, Header = "Service Name", FldWidth = 3}},
                    {new TheFieldInfo() {FldOrder = 14, DataItem = "MyStationUrl", Type = eFieldType.SingleEnded, Header = "Node Url", FldWidth = 3}},
                    {new TheFieldInfo() {FldOrder = 15, DataItem = "Version", Type = eFieldType.Number, Header = "Version", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 16, DataItem = "LastMessage", Type = eFieldType.SingleEnded, Header = "Last Message", FldWidth = 4}},
                    {new TheFieldInfo() {FldOrder = 17, DataItem = "UpdateDate", Type = eFieldType.DateTime, Header = "Last Plugin Update", FldWidth = 2}},
                    {new TheFieldInfo() {FldOrder = 18, DataItem = "RegisterDate", Type = eFieldType.DateTime, Header = "Initial Install", FldWidth = 2}},
                    {new TheFieldInfo() {FldOrder = 19, DataItem = "IsIsolated", Type = eFieldType.SingleCheck, Header = "Is Isolated", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 20, DataItem = "IsUnloaded", Type = eFieldType.SingleCheck, Header = "Not Loaded", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 21, DataItem = "IsAlive", Type = eFieldType.SingleCheck, Header = "Is Alive", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 22, DataItem = "IsEngineReady", Type = eFieldType.SingleCheck, Header = "Is Ready", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 23, DataItem = "IsInitializing", Type = eFieldType.SingleCheck, Header = "Is in Init"}},
                    {new TheFieldInfo() {FldOrder = 24, DataItem = "IsInitialized", Type = eFieldType.SingleCheck, Header = "Is Initialized"}},
                    {new TheFieldInfo() {FldOrder = 25, DataItem = "IsLiveEngine", Type = eFieldType.SingleCheck, Header = "Is Live"}},
                    {new TheFieldInfo() {FldOrder = 26, DataItem = "IsService", Type = eFieldType.SingleCheck, Header = "Is Service"}},
                    {new TheFieldInfo() {FldOrder = 27, DataItem = "IsMiniRelay", Type = eFieldType.SingleCheck, Header = "Is MiniRelay"}},
                    {new TheFieldInfo() {FldOrder = 28, DataItem = "IsSimulated", Type = eFieldType.SingleCheck, Header = "Is Simulated"}},
                    {new TheFieldInfo() {FldOrder = 30, DataItem = "HasJSEngine", Type = eFieldType.SingleCheck, Header = "Has JSEngine"}},
                    {new TheFieldInfo() {FldOrder = 31, DataItem = "IsAllowedUnscopedProcessing", Type = eFieldType.SingleCheck, Header = "Allows Unscoped"}},
                    {new TheFieldInfo() {FldOrder = 32, DataItem = "IsAllowedForeignScopeProcessing", Type = eFieldType.SingleCheck, Header = "Allows Foreign Scopes"}},
                    {new TheFieldInfo() {FldOrder = 33, DataItem = "IsAcceptingFilePush", Type = eFieldType.SingleCheck, Header = "Allows File Push"}},
                    {new TheFieldInfo() {FldOrder = 34, DataItem = "IsAllowedForIsolation", Type = eFieldType.SingleCheck, Header = "Can be Isolated"}},
                    {new TheFieldInfo() {FldOrder = 35, DataItem = "IsAllowedToNodeHopp", Type = eFieldType.SingleCheck, Header = "Can node-hopp"}},
                    {new TheFieldInfo() {FldOrder = 41, DataItem = "IsEngineStopped", Type = eFieldType.SingleCheck, Header = "Is Stopped"}},
                    {new TheFieldInfo() {FldOrder = 62, DataItem = "QueueLength", Type = eFieldType.Number, Header = "Queue Length", FldWidth = 1}},
                });

                var ThingTemplate = new TheFormInfo(new Guid("{5EBDEB3A-B11B-467A-94D2-71148F4FEF18}"), eEngineName.NMIService, "The Thing Editor", "TheThing;:;")
                { cdeA = 128, TableReference = $"{new Guid("{B510837F-3B75-4CF2-A900-D36C19113A13}")}", TileWidth = 12, DefaultView = eDefaultView.Form, IsNotAutoLoading = true, PropertyBag = new nmiCtrlFormTemplate { /*IsPopup=true*/ } };
                TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, ThingTemplate, "CMyTable", "Thing Editor", 3, 9, 128, "NMI Administration", null, new nmiDashboardTile { ForceLoad = true, Visibility = false, HideFromSideBar = true/*, IsPopup=true coming with task 1301*/ });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.SingleEnded, 10, 2, 0x0, "Friendly Name", "FriendlyName", new nmiCtrlSingleEnded() { TileWidth = 12 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.SingleEnded, 20, 2, 0x0, "Current Value", "Value", new nmiCtrlSingleEnded() { TileWidth = 12 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 30, 2, 0x0, "", null, new nmiCtrlTileButton { Thumbnail = "FA3:f044", NoTE = true, ClassName = "cdeTransitButton", OnClick = "TTS:<%cdeMID%>", TileHeight = 1, TileWidth = 1 });
                TheFieldInfo tDlT = TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 40, 2, 0x0, "", null, new nmiCtrlTileButton() { Thumbnail = "FA3:f019", NoTE = true, ClassName = "cdeGoodActionButton", TileWidth = 1 });
                tDlT.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "DOWNLOAD", OnDownloadClick);

                TheFieldInfo tExportT = TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 45, 2, 0x0, "", null, new nmiCtrlTileButton() { Thumbnail = "FA3:f14d", NoTE = true, ClassName = "cdeGoodActionButton", TileWidth = 1 });
                tExportT.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "EXPORT", (t, p) => OnExportClick(t, p, false, false, false, false));
                TheFieldInfo tExportTCDEF = TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 46, 2, 0x0, "Export CDEF", null, new nmiCtrlTileButton() { NoTE = true, ClassName = "cdeGoodActionButton", TileWidth = 1 });
                tExportTCDEF.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "EXPORTCDEF", (t, p) => OnExportClick(t, p, false, false, false, true));

                TheFieldInfo tExportGeneralizedT = TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 47, 2, 0x0, "Export Pipeline Generalized", null, new nmiCtrlTileButton() { NoTE = true, ClassName = "cdeGoodActionButton", TileWidth = 2 });
                tExportGeneralizedT.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "EXPORTGENERALIZED", (t, p) => OnExportClick(t, p, true, false, false, false));

                TheFieldInfo tExportGeneralizedTCDEF = TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 48, 2, 0x0, "Export Pipeline Generalized CDEF", null, new nmiCtrlTileButton() { NoTE = true, ClassName = "cdeGoodActionButton", TileWidth = 2 });
                tExportGeneralizedTCDEF.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "EXPORTGENERALIZEDCDEF", (t, p) => OnExportClick(t, p, true, false, false, true));

                TheFieldInfo tExportAnswerT = TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 49, 2, 0x0, "Export Pipeline Answer File", null, new nmiCtrlTileButton() { NoTE = true, ClassName = "cdeGoodActionButton", TileWidth = 2 });
                tExportAnswerT.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "EXPORTANSWER", (t, p) => OnExportClick(t, p, true, true, true, false));
                TheFieldInfo tExportAnswerTCDEF = TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileButton, 50, 2, 0x0, "Export Pipeline Answer File CDEF", null, new nmiCtrlTileButton() { NoTE = true, ClassName = "cdeGoodActionButton", TileWidth = 2 });
                tExportAnswerTCDEF.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "EXPORTANSWERCDEF", (t, p) => OnExportClick(t, p, true, true, true, true));

                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TileGroup, 60, 0, 0, null, null, new nmiCtrlTileGroup { TileWidth = 7, TileHeight = 1, TileFactorY = 2 });

                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.CollapsibleGroup, 100, 2, 0x0, "Base Properties...", null, new nmiCtrlCollapsibleGroup() { IsSmall = true, DoClose = true, TileWidth = 6 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.SingleEnded, 110, 0, 0x0, "Engine Name", "EngineName", new nmiCtrlSingleEnded() { ParentFld = 100 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.SingleEnded, 120, 0, 0x0, "Device Type", "DeviceType", new nmiCtrlSingleEnded() { ParentFld = 100 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.SingleEnded, 130, 0, 0x0, "Address", "Address", new nmiCtrlSingleEnded() { ParentFld = 100 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.SingleEnded, 140, 0, 0x0, "ID", "ID", new nmiCtrlSingleEnded() { ParentFld = 100 });

                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.CollapsibleGroup, 200, 2, 0x0, "Current Status...", null, new nmiCtrlCollapsibleGroup() { IsSmall = true, DoClose = true, TileWidth = 6 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.StatusLight, 210, 0, 0, null, "StatusLevel", new nmiCtrlSingleEnded() { NoTE = true, ParentFld = 200, TileWidth = 2, TileHeight = 1 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.TextArea, 220, 0, 0, null, "LastMessage", new nmiCtrlSingleEnded() { NoTE = true, ParentFld = 200, TileWidth = 4, TileHeight = 1 });
                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.Number, 280, 0, 0, "Startup Time", "cdeStartupTime", new nmiCtrlNumber() { ParentFld = 200, TileWidth = 3, TileHeight = 1 });

                TheNMIEngine.AddSmartControl(MyBaseThing, ThingTemplate, eFieldType.CollapsibleGroup, 300, 2, 0x0, "All Properties...", null, new nmiCtrlCollapsibleGroup() { IsSmall = true, DoClose = true, TileWidth = 12 });

                TheNMIEngine.AddFields(ThingTemplate, new List<TheFieldInfo>
                {
                    {new TheFieldInfo() {FldOrder = 230, DataItem = "cdeMID", Flags = 0, Type = eFieldType.SmartLabel, TileWidth = 6, Format = "<span style='font-size:12px'>MID:%cdeMID%<br>Owner:%cdeO%</span>",  PropertyBag=new nmiCtrlSmartLabel{ NoTE=true, ParentFld=200 } }},

                    {new TheFieldInfo() {FldOrder = 250, DataItem = "HasLiveObject", Flags = 0, Type = eFieldType.SingleCheck, Header = "Is Alive", TileWidth = 3, PropertyBag = new ThePropertyBag() {"ParentFld=200"}}},
                    {new TheFieldInfo() {FldOrder = 260, DataItem = "IsInitialized", Flags = 0, Type = eFieldType.SingleCheck, Header = "Is Init", TileWidth = 3, PropertyBag = new ThePropertyBag() {"ParentFld=200"}}},
                    {new TheFieldInfo() {FldOrder = 270, DataItem = "IsUXInitialized", Flags = 0, Type = eFieldType.SingleCheck, Header = "UX Init",  TileWidth = 3, PropertyBag = new ThePropertyBag() {"ParentFld=200"}}},
                    {new TheFieldInfo() {FldOrder = 310, DataItem = "mypropertybag", Flags = 0, Type = eFieldType.Table, TileWidth = 12, TileHeight = 6, PropertyBag = new ThePropertyBag() {"ParentFld=300", "NoTE=true" }}},
                    {new TheFieldInfo() {FldOrder = 70, DataItem = "CDE_DELETE", Flags = 2, Type = eFieldType.FormButton }},
                });




                //Old ThingRegistry Table
                tInf = new TheFormInfo(new Guid("{B510837F-3B75-4CF2-A900-D36C19113A13}"), eEngineName.NMIService, "The Thing Registry", "TheThing") { cdeA = 128, IsReadOnly = false, IsNotAutoLoading = true, PropertyBag = new nmiCtrlTableView { TemplateID = "5EBDEB3A-B11B-467A-94D2-71148F4FEF18", ShowFilterField = true, ShowExportButton=true } };
                TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, tInf, "CMyTable", "Thing Registry", 3, 9, 128, "NMI Administration", null, new nmiDashboardTile { TileThumbnail = "FA5:f1c0", ForceLoad = true });
                TheNMIEngine.AddFields(tInf, new List<TheFieldInfo>
                {
                    {new TheFieldInfo() {FldOrder = 80, DataItem = "cdeMID", Flags = 0, Type = eFieldType.SmartLabel, Header = "MID/Owner", TileLeft = 2, TileTop = 2, TileWidth = 7, FldWidth = 6, Format = "<span style='font-size:12px'>MID:%cdeMID%<br>Owner:%cdeO%</span>"}},
                    {new TheFieldInfo() {FldOrder = 6, DataItem = "MyPropertyBag.FriendlyName.Value", Flags = 2, Type = eFieldType.SingleEnded, Header = "Friendly Name", TileLeft = 0, TileTop = 1, TileWidth = 10, TileHeight = 1, FldWidth = 6}},

                    {new TheFieldInfo() {FldOrder = 13, DataItem = "MyPropertyBag.EngineName.Value", Flags = 0, Type = eFieldType.SingleEnded, Header = "Engine Name", TileLeft = 0, TileTop = 4, TileWidth = 10, TileHeight = 1, FldWidth = 2}},
                    {new TheFieldInfo() {FldOrder = 14, DataItem = "MyPropertyBag.DeviceType.Value", Flags = 0, Type = eFieldType.SingleEnded, Header = "DeviceType", TileLeft = 0, TileTop = 5, TileWidth = 10, TileHeight = 1, FldWidth = 2}},
                    {new TheFieldInfo() {FldOrder = 15, DataItem = "MyPropertyBag.ID.Value", Flags = 0, Type = eFieldType.SingleEnded, Header = "ID", TileLeft = 0, TileTop = 3, TileWidth = 10, TileHeight = 1, FldWidth = 3, Format = ""}},
                    {new TheFieldInfo() {FldOrder = 16, DataItem = "MyPropertyBag.Address.Value", Flags = 0, Type = eFieldType.SingleEnded, Header = "Address", TileLeft = 0, TileTop = 6, TileWidth = 10, TileHeight = 1, FldWidth = 6, PropertyBag = new ThePropertyBag() { "Truncate=true" } } }, // "Style=text-overflow:ellipsis;overflow:hidden; max-width:624px"}}},
                    {new TheFieldInfo() {FldOrder = 17, DataItem = "MyPropertyBag.Value.Value", Flags = 2, Type = eFieldType.SingleEnded, Header = "Current Value", TileLeft = 0, TileTop = 7, TileWidth = 10, TileHeight = 1, FldWidth = 4, PropertyBag = new ThePropertyBag() {"Truncate=true" } } },// "Style=text-overflow:ellipsis;overflow:hidden; max-width:624px"}}},
                    {new TheFieldInfo() {FldOrder = 18, DataItem = "MyPropertyBag.cdeStartupTime.Value", Flags = 0, Type = eFieldType.Number, Header = "Startup Time", TileLeft = 0, TileTop = 8, TileWidth = 10, TileHeight = 1, FldWidth = 1 }},

                    {new TheFieldInfo() {FldOrder = 20, DataItem = "HasLiveObject", Flags = 0, Type = eFieldType.SingleCheck, Header = "Is Alive", TileLeft = 0, TileTop = 9, TileWidth = 3, FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 21, DataItem = "IsInitialized", Flags = 0, Type = eFieldType.SingleCheck, Header = "Is Init", TileLeft = 3, TileTop = 9, TileWidth = 3, FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 22, DataItem = "IsUXInitialized", Flags = 0, Type = eFieldType.SingleCheck, Header = "UX Init", TileLeft = 6, TileTop = 9, TileWidth = 3, FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 23, DataItem = "MyPropertyBag.StatusLevel.Value", Flags = 0, Type = eFieldType.Number, Header = "Status", TileLeft = 0, TileTop = 10, TileWidth = 10, FldWidth = 1}},

                    {new TheFieldInfo() {FldOrder = 4, DataItem = "CDE_DETAILS", Flags = 2, Type = eFieldType.FormButton, TileLeft = 10, TileTop = 1}},
                });
                TheNMIEngine.AddTableButtons(tInf, true, 100, 0x22, 0);
                TheFieldInfo tDl = TheNMIEngine.AddSmartControl(MyBaseThing, tInf, eFieldType.TileButton, 3, 2, 0x0, "", null, new ThePropertyBag() { "Thumbnail=FA3:f019", "TileLeft=11", "TileTop=1", "TileWidth=1", "TileHeight=1" });
                tDl.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "DOWNLOAD", OnDownloadClick);

                TheFormInfo tPageDefs = new TheFormInfo(new Guid("{8B6ACC8C-66A8-4DC2-A33D-598F995B3EE9}"), eEngineName.NMIService, "Web Page Statistics", "nsCDEngine.Engines.NMIService.ThePageDefinition;:;100;:;true") { IsReadOnly = true, IsNotAutoLoading = true };
                TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, tPageDefs, "CMyTable", "Page Statistics", 4, 0x0, 0, "NMI Administration", null, new nmiDashboardTile { TileThumbnail = "FA5:f478" });
                TheNMIEngine.AddFields(tPageDefs, new List<TheFieldInfo>
                {
                    {new TheFieldInfo() {FldOrder = 2, DataItem = "Title", Flags = 0, Type = eFieldType.SingleEnded, Header = "Page Title", FldWidth = 3}},
                    {new TheFieldInfo() {FldOrder = 20, DataItem = "PageName", cdeA = 0x80, Flags = 0, Type = eFieldType.SingleEnded, Header = "Page Path", FldWidth = 3}},
                    {new TheFieldInfo() {FldOrder = 5, DataItem = "LastAccess", Flags = 0, Type = eFieldType.DateTime, Header = "Last Access", FldWidth = 2}},
                    {new TheFieldInfo() {FldOrder = 3, DataItem = "Hits", Flags = 0, Type = eFieldType.Number, Header = "Hits", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 4, DataItem = "Errors", Flags = 0, Type = eFieldType.Number, Header = "Errors", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 21, DataItem = "IncludeCDE", cdeA = 0x80, Flags = 0, Type = eFieldType.SingleCheck, Header = "CDE", FldWidth = 1}}, //ORG-OK
                    {new TheFieldInfo() {FldOrder = 22, DataItem = "IsNotCached", cdeA = 0x80, Flags = 0, Type = eFieldType.SingleCheck, Header = "Not Cached", FldWidth = 1}},
                });

                tInf = new TheFormInfo(TheThing.GetSafeThingGuid(MyBaseThing, "SYSLOG"), eEngineName.NMIService, "System Log", "nsCDEngine.BaseClasses.TheEventLogEntry;:;50;:;true") { IsReadOnly = true, IsNotAutoLoading = true, GetFromFirstNodeOnly = true, PropertyBag = new nmiCtrlTableView { ShowFilterField = true, ShowExportButton=true } };
                TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, tInf, "CMyTable", "System Log", 10, 0x9, 128, TheNMIEngine.GetNodeForCategory(), null, new nmiDashboardTile { TileThumbnail = "FA5:f15c" });
                TheNMIEngine.AddFields(tInf, new List<TheFieldInfo>
                {
                    {new TheFieldInfo() {FldOrder = 1, DataItem = "EventID", Flags = 0, Type = eFieldType.Number, Header = "ID", FldWidth = 2}},
                    {new TheFieldInfo() {FldOrder = 2, DataItem = "Source", Flags = 0, Type = eFieldType.SingleEnded, Header = "Source", FldWidth = 4}},
                    {new TheFieldInfo() {FldOrder = 3, DataItem = "cdeCTIM", Flags = 0, Type = eFieldType.DateTime, Header = "Event Time", FldWidth = 4}},
                    {new TheFieldInfo() {FldOrder = 4, DataItem = "Message.ENG", Flags = 0, Type = eFieldType.SingleEnded, Header = "Service", FldWidth = 4}},
                    {new TheFieldInfo() {FldOrder = 6, DataItem = "Message.TXT", Flags = 0, Type = eFieldType.SingleEnded, Header = "Text", FldWidth = 6}},
                    {new TheFieldInfo() {FldOrder = 7, DataItem = "Message.PLS", Flags = 0, Type = eFieldType.SingleEnded, Header = "Details", FldWidth = 8}}
                });

                tInf = new TheFormInfo(TheThing.GetSafeThingGuid(MyBaseThing, "MYVIEWS"), eEngineName.NMIService, "My Scenes", string.Format("TheThing;:;0;:;True;:;EngineName={0};DeviceType={1}", eEngineName.NMIService, eKnownDeviceTypes.TheNMIScene));
                TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, tInf, "CMyTable", "My Scenes", 5, 9, 0, TheNMIEngine.GetNodeForCategory(), null, new nmiDashboardTile { TileThumbnail = "FA5:f302" });
                TheNMIEngine.AddFields(tInf, new List<TheFieldInfo>
                {
                    {new TheFieldInfo() {FldOrder = 1, DataItem = "", Flags = 2, Type = eFieldType.TileButton, Header = "Load Scene", FldWidth = 1, PropertyBag = new nmiCtrlTileButton() {OnClick = "cdeNMI.GetScene('%cdeMID%');", ClassName = "cdeTableButton", TileHeight = 1}}},
                    {new TheFieldInfo() {FldOrder = 2, DataItem = "MyPropertyBag.FriendlyName.Value", Flags = 2, Type = eFieldType.SingleEnded, Header = "Scene Name", FldWidth = 4}},
                    {new TheFieldInfo() {FldOrder = 3, DataItem = "MyPropertyBag.IsPublic.Value", Flags = 2, Type = eFieldType.SingleCheck, Header = "Public", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 100, DataItem = "CDE_DELETE", Flags = 2, Type = eFieldType.TileButton, TileLeft = 0, TileTop = 9}},
                });

                tInf = new TheFormInfo(TheThing.GetSafeThingGuid(MyBaseThing, "LIVESCREENS"), eEngineName.NMIService, "Live Screens", string.Format("TheThing;:;0;:;True;:;EngineName={0};DeviceType={1}", eEngineName.NMIService, eKnownDeviceTypes.TheNMIScreen)) { AddButtonText = "Add Screen" };
                TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, tInf, "CMyTable", "My Live Screens", 5, 9, 0, TheNMIEngine.GetNodeForCategory(), null, new ThePropertyBag { "TileThumbnail=FA5Sf013" }); //<i class='fa faIcon fa-spin fa-5x'>&#xf013;</i></br>
                TheNMIEngine.AddFields(tInf, new List<TheFieldInfo>
                {
                    {new TheFieldInfo() {FldOrder = 2, DataItem = "MyPropertyBag.FriendlyName.Value", Flags = 2, Type = eFieldType.SingleEnded, Header = "Screen Name", FldWidth = 3}},
                    {new TheFieldInfo() {FldOrder = 3, DataItem = "MyPropertyBag.TileWidth.Value", Flags = 2, Type = eFieldType.Number, Header = "XL", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 4, DataItem = "MyPropertyBag.TileHeight.Value", Flags = 2, Type = eFieldType.Number, Header = "YL", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 5, DataItem = "MyPropertyBag.FormTitle.Value", Flags = 2, Type = eFieldType.SingleEnded, Header = "Screen Title", FldWidth = 3}},
                    {new TheFieldInfo() {FldOrder = 8, DataItem = "MyPropertyBag.Category.Value", Flags = 2, Type = eFieldType.SingleEnded, Header = "Category", FldWidth = 2}},
                    {new TheFieldInfo() {FldOrder = 10, DataItem = "MyPropertyBag.IsAbsolute.Value", Flags = 2, Type = eFieldType.SingleCheck, Header = "Absolute Positions", FldWidth = 1}},
                    {new TheFieldInfo() {FldOrder = 100, DataItem = "CDE_DELETE", Flags = 2, Type = eFieldType.TileButton }},
                });
                TheNMIEngine.AddSmartControl(MyBaseThing, tInf, eFieldType.TileButton, 1, 2, 0x0, "", null, new nmiCtrlTileButton() { Thumbnail = "FA3:f022", NoTE = true, TileWidth = 1, TileHeight = 1, ClassName = "cdeTransitButton", OnClick = "TTS:<%cdeMID%>" });


                if (TheBaseAssets.MyServiceHostInfo.IsUsingUserMapper)
                {
                    UserManID = TheThing.GetSafeThingGuid(TheCDEngines.MyNMIService.GetBaseThing(), "USEMAN").ToString().ToLower();
                    tInf = new TheFormInfo(TheCommonUtils.CGuid(UserManID), eEngineName.NMIService, "User Admin", "TheUserDetails") { AddTemplateType = "D270C52C-43AB-4613-9E92-8E08C60526E8", IsNotAutoLoading = true, GetFromFirstNodeOnly = true, AddButtonText = "Add new User", RowTemplateType = "D270C52C-43AB-4613-9E92-8E08C60526E8", TileWidth = 12 };
                    TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, tInf, "CMyTable", "Admin Users", 6, 9, 128, TheNMIEngine.GetNodeForCategory(), null, new nmiDashboardTile { TileThumbnail = "FA5:f0c0" });
                    TheNMIEngine.AddFields(tInf, new List<TheFieldInfo>
                    {
                        {new TheFieldInfo() {FldOrder = 20, DataItem = "Name", Flags = 2, Type = eFieldType.SingleEnded, Header = "Name", FldWidth = 4}},
                        {new TheFieldInfo() {FldOrder = 40, DataItem = "EMail", Flags = 2, Type = eFieldType.eMail, Header = "Email", FldWidth = 4}},
                        {new TheFieldInfo() {FldOrder = 110, DataItem = "LCID", Flags = 2, Type = eFieldType.ComboBox, Header = "Language", FldWidth = 2, PropertyBag = new ThePropertyBag() {"Options=Browser:0;English:1033;Deutsch:1031"}}}, //TODO:V4:Load From a StorageMirror with all Language IDs
                        {new TheFieldInfo() {FldOrder = 500, DataItem = "CDE_DELETE", Flags = 2, Type = eFieldType.TileButton}},
                        {new TheFieldInfo() {FldOrder = 5, DataItem = "CDE_DETAILS", Flags = 2, Type = eFieldType.TileButton}},
                    });


                    CreateUserPreferences();
                    CreateUserTemplate();
                }

                TheNMIEngine.AddDashPanels(tDash, new List<TheDashPanelInfo>
                {

                    {
                        new TheDashPanelInfo(MyBaseThing)
                        {
                            cdeMID = new Guid("{0A3F93CE-4C1A-457A-811A-6679AF4DEE9E}"), cdeA = 128, Flags = 3,
                            FldOrder = 2, PanelTitle = "Check for Updates", ControlClass = "jsAction:CFU", Category = "NMI Administration",
                            PropertyBag=new nmiCtrlTileButton{ Thumbnail="FA5:f01c" }
                        }
                    },

               });

                TheDashboardInfo tDashActInfo = TheNMIEngine.AddDashboard(MyBaseThing, new TheDashboardInfo(eActivationAndStatusDashGuid, "-HIDE") { FldOrder = 99998, PropertyBag = new nmiDashboard { ForceLoad = true } });
                //New in 3.105 - Status Page
                TheFormInfo tStatusForm = new TheFormInfo(TheBaseAssets.MyServiceHostInfo.MyDeviceInfo.DeviceID,
                        eEngineName.NMIService, $"Current Status: {TheBaseAssets.MyServiceHostInfo.ApplicationTitle} - <span style='font-size:xx-small'>###On Node###: {TheBaseAssets.MyServiceHostInfo.MyStationName}</span>", null)
                { DefaultView = eDefaultView.Form, GetFromFirstNodeOnly = false };
                TheNMIEngine.AddFormToThingUX(tDashActInfo, MyBaseThing, tStatusForm, "CMyTable", "###Current Node Status###", 300, 11, 0, TheNMIEngine.GetNodeForCategory(), null, new ThePropertyBag() { "TileThumbnail=FA3:f05a", "HidePins=true" });

                tMeta = TheBaseAssets.MyServiceHostInfo.GetMeta("/STATUS");
                tMeta += "<meta name=\"msapplication-task\" content=\"name=The Status Overview;action-uri=" + TheBaseAssets.MyServiceHostInfo.GetPrimaryStationURL(false) + "/STATUS;icon-uri=/" + TheBaseAssets.MyServiceHostInfo.favicon_ico + "\" />";
                TheNMIEngine.AddPageDefinition(new ThePageDefinition(new Guid("{D4987E90-CCE0-4888-AE88-79D7BD173902}"), "/STATUS", TheBaseAssets.MyServiceHostInfo.ApplicationTitle, "nmiportal", Guid.Empty)
                {
                    WPID = 20,
                    IncludeCDE = true,
                    IsPublic = true,
                    RequireLogin = false,
                    PortalGuid = eActivationAndStatusDashGuid,
                    StartScreen = TheBaseAssets.MyServiceHostInfo.MyDeviceInfo.DeviceID,
                    AddHeader = tMeta,
                    MobileConstrains = 480,
                    AdminRole = "NMIADMIN",
                    BrandPage = true,
                    IncludeHeaderButtons = false,
                    IsLiteTheme = false
                });
                TheDashboardInfo tDashStatus = TheNMIEngine.GetDashboardById(eNMIDashboard);
                TheNMIEngine.AddAboutButton(MyBaseEngine.GetBaseThing().GetBaseThing(), tDashStatus, TheNMIEngine.GetNodeForCategory());


                if (!TheBaseAssets.MyServiceHostInfo.IsCloudService)
                {

                    TheFormInfo tActivationForm = new TheFormInfo(TheThing.GetSafeThingGuid(MyBaseThing, "ActivationGuid"), eEngineName.NMIService, "", string.Format("TheThing;:;0;:;True;:;cdeMID={0}", MyBaseThing.cdeMID)) { DefaultView = eDefaultView.Form, PropertyBag = new nmiCtrlFormView { TileWidth = 12 } };
                    TheNMIEngine.AddFormToThingUX(TheNMIEngine.GetDashboardById(eActivationAndStatusDashGuid), MyBaseThing, tActivationForm, "CMyForm", "Activation", 3, 1, 0, TheNMIEngine.GetNodeForCategory(), null, new nmiDashboardTile { Caption = "<span class='fa fa-5x'>&#xf13E;</span></br>Activate", Visibility = false, HidePins = true });

                    //top tile
                    TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileGroup, 10, 0, 0, "", null, new nmiCtrlTileGroup() { TileWidth = 12, TileHeight = 2, Background = "rgba(128,128,128,.1)", Style = "display:flex; flex-direction:row; align-content: baseline;" });
                    TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.Picture, 11, 0, 0, "", null, new nmiCtrlPicture() { TileWidth = 2, TileHeight = 2, ParentFld = 10, Source = "Images/toplogo-150.png" });
                    TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileGroup, 12, 0, 0, "", null, new nmiCtrlTileGroup() { TileWidth = 8, TileHeight = 2, ParentFld = 10, Style = "display:flex; align-items:flex-end " });
                    mFormLabelField = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.SmartLabel, 13, 0, 0, null, null, ThePropertyBag.Create(new nmiCtrlSmartLabel() { NoTE = true, Text = "Activate your " + TheBaseAssets.MyServiceHostInfo.ApplicationName, TileWidth = 8, TileHeight = 1, Background = "transparent", ParentFld = 12, Style = "font-size: 30px;" })); //2.4vw;" }));
                    TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.Picture, 14, 0, 0, "", null, new nmiCtrlPicture() { TileWidth = 2, TileHeight = 2, Source = "Images/toplogo-150.png", ParentFld = 10 });

                    mRequestKeyFld = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.SmartLabel, 16, 0, 0, "Request Key", "ActivationRequestKey", new nmiCtrlSmartLabel() { TileWidth = 10, TileHeight = 1, ParentFld = 20, FontSize = 24, VerticalAlignment = "Center" });

                    if (string.IsNullOrEmpty(TheThing.GetSafePropertyString(MyBaseThing, "ActivationRequestKey")))
                        TheThing.SetSafePropertyString(MyBaseThing, "ActivationRequestKey", TheBaseAssets.MyActivationManager.GetActivationRequestKey(TheBaseAssets.MyServiceHostInfo.SKUID));
                    TheThing.SetSafePropertyString(MyBaseThing, "ActivationKey", "");
                    //mdl portion
                    TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileGroup, 20, 0, 0, "", null, new nmiCtrlTileGroup() { TileWidth = 12, TileHeight = 3, Background = "rgba(128,128,128,.1)" }); //, ClassName = "cdeFlexCol cdeFlexCenter cdeTileGroup"
                    TheFieldInfo tKey = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.SingleEnded, 21, 2, 0, "Activation Key", "ActivationKey", new nmiCtrlSingleEnded() { TileWidth = 10, TileHeight = 1, HelpText = "Please enter a valid key to activate your Relay.", ParentFld = 20 });
                    TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileGroup, 22, 0, 0, "", null, new nmiCtrlTileGroup() { TileWidth = 12, TileHeight = 2, ParentFld = 20 }); //, ClassName = "cdeFlexCol cdeFlexCenter cdeTileGroup"

                    //loading
                    TheFieldInfo tLoader = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileGroup, 30, 0, 0, "", null, new nmiCtrlTileGroup() { TileWidth = 12, TileHeight = 1, Background = "rgba(128,128,128,.1)", ClassName = "cdeFlexCol cdeFlexCenter cdeTileGroup", Visibility = false });
                    TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.SmartLabel, 31, 0, 0, "<i class='fa faIcon fa-spin fa-4x'>&#xf013;</i>", null, new nmiCtrlSmartLabel() { TileWidth = 12, TileHeight = 1, ParentFld = 30, Background = "transparent;" });

                    TheFieldInfo tResulter = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileGroup, 32, 0, 0, "", null, new nmiCtrlTileGroup() { TileWidth = 12, TileHeight = 3, Background = "rgba(128,128,128,.1)", Visibility = false }); //ClassName = "cdeFlexCol cdeFlexCenter cdeTileGroup",
                    TheFieldInfo tSuccess = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.SmartLabel, 33, 0, 0, null, null, new nmiCtrlSmartLabel() { TileWidth = 10, TileHeight = 2, Background = "rgba(255,255,255,0.1)", ParentFld = 32, Style = "font-size:30px;" });

                    TheFieldInfo tButRestart = null;
                    if (!TheCommonUtils.IsDeviceSenderType(TheBaseAssets.MyServiceHostInfo.MyDeviceInfo.SenderType))
                    {
                        string RndDef = TheCommonUtils.GetRandomUInt(0, 65000).ToString();
                        tButRestart = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileButton, 24, 2, 0, "&nbsp;", null, new nmiCtrlTileButton() { Caption = "Restart Node", Visibility = false, TileWidth = 10, ParentFld = 22, AreYouSure = "Are you sure to restart this Node?", ClassName = "cdeBadActionButton" });
                        tButRestart.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, RndDef, (pThing, pObj) =>
                        {
                            TheProcessMessage pMsg = pObj as TheProcessMessage;
                            if (pMsg?.Message == null) return;
                            if (TheBaseAssets.MyServiceHostInfo.IsCloudService || !pMsg.Message.IsFirstNode() || TheBaseAssets.MyApplication.MyISMRoot == null) return;
                            string[] pCmds = pMsg.Message.PLS.Split(':');
                            if (pCmds.Length > 2 && pCmds[1] == RndDef)
                                TheBaseAssets.MyApplication.MyISMRoot.Restart(false);
                        });
                    }
                    TheFieldInfo tActivator = TheNMIEngine.AddSmartControl(MyBaseThing, tActivationForm, eFieldType.TileButton, 23, 2, 0, "&nbsp;", null, new nmiCtrlTileButton() { Caption = "Activate Now", TileWidth = 10, TileHeight = 1, Background = "gray", ParentFld = 22, ClassName = "cdeLiveTile" });
                    string tActCookie = "Act" + TheCommonUtils.GetRandomUInt(0, 10000);
                    tActivator.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, tActCookie, (sender, para) =>
                    {
                        TheNMIEngine.SetUXProperty(Guid.Empty, tResulter.cdeMID, "Visibility=false");
                        TheNMIEngine.SetUXProperty(Guid.Empty, tKey.cdeMID, "Disabled=true");
                        TheNMIEngine.SetUXProperty(Guid.Empty, tLoader.cdeMID, "Visibility=true");
                        bool bSuccess = ActivateRelay();
                        TheNMIEngine.SetUXProperty(Guid.Empty, tLoader.cdeMID, "Visibility=false");
                        TheNMIEngine.SetUXProperty(Guid.Empty, tResulter.cdeMID, "Visibility=true");
                        if (bSuccess)
                        {
                            TheNMIEngine.SetUXProperty(Guid.Empty, tSuccess.cdeMID, "Text=Thank you for activating your Relay! Click here to configure it.:;:Background=rgba(0,255,0,.2)");
                            if (tButRestart != null)
                                TheNMIEngine.SetUXProperty(Guid.Empty, tButRestart.cdeMID, "Visibility=true");
                            TheNMIEngine.SetUXProperty(Guid.Empty, tActivator.cdeMID, "Visibility=false");
                            ChangeActivationForm(true);
                        }
                        else
                        {
                            TheNMIEngine.SetUXProperty(Guid.Empty, tSuccess.cdeMID, "Text=Sorry, but the key you entered was not valid. Please Try again:;:Background=rgba(255,0,0,.2)");
                            TheNMIEngine.SetUXProperty(Guid.Empty, tKey.cdeMID, "Disabled=false");
                        }
                    });

                    if (TheBaseAssets.MyActivationManager.IsSKUActivated(TheBaseAssets.MyServiceHostInfo.SKUID))
                        ChangeActivationForm(false);

                    TheNMIEngine.AddPageDefinition(new ThePageDefinition(new Guid("{D514DC92-1108-4701-808D-1689537D9757}"), "/ACTIVATE", "Relay Activation", "nmiportal.html", Guid.Empty)
                    { WPID = 10, IncludeCDE = true, RequireLogin = true, IsPublic = false, PortalGuid = eActivationAndStatusDashGuid, StartScreen = tActivationForm.cdeMID });
                }
                InitNMIAssets();
            }
            TheNMIEngine.RegisterEngine(MyBaseEngine);
            mIsUXInitialized = true;
            return true;
        }

        bool ActivateRelay()
        {
            string activationKey = TheThing.GetSafePropertyString(MyBaseThing, "ActivationKey");
            return TheBaseAssets.MyActivationManager.ApplyActivationKey(activationKey, Guid.Empty, out _);
        }

        void ChangeActivationForm(bool justActivated)
        {
            if (justActivated)
            {
                mFormLabelField.SetUXProperty(Guid.Empty, "Text=Activate License");
                mRequestKeyFld.SetUXProperty(Guid.Empty, "Visibility=false");
            }
            else
            {
                mFormLabelField.SetUXProperty(Guid.Empty, "Text=Activate additional Licenses");
            }
        }

        /// <summary>
        /// The complete NMI (Natural Machine Interface) Meta Data is stored in the MyNMIModel
        /// </summary>
        private static string UserPrefID;
        private static string UserManID;

        public override bool Init()
        {
            if (mIsInitialized) return false;
            mIsInitialized = true;
            if (!TheBaseAssets.MyServiceHostInfo.DisableNMI)
            {
                MyBaseThing.RegisterEvent(eEngineEvents.IncomingMessage, HandleMessage);
                if (TheCommCore.MyHttpService != null)
                {
                    TheCommCore.MyHttpService.RegisterHttpInterceptorB4("/SITEMAP.XML", InterceptHttpRequestSiteMap);
                    TheCommCore.MyHttpService.RegisterHttpInterceptorB4("/CDE", InterceptHttpRequestB4);
                    TheCommCore.MyHttpService.RegisterHttpInterceptorB4("/IMAGES", InterceptHttpRequestB4);
                    TheCommCore.MyHttpService.RegisterHttpInterceptorB4("/JS", InterceptHttpRequestB4);
                    TheCommCore.MyHttpService.RegisterHttpInterceptorB4("/CSS", InterceptHttpRequestB4);
                    TheCommCore.MyHttpService.RegisterHttpInterceptorB4("/", InterceptHttpRequestAfter2);
                    TheCommCore.MyHttpService.RegisterHttpInterceptorAfter("/", InterceptHttpRequestAfter);
                }
                TheBaseAssets.MySYSLOG.WriteToLog(10004, TSM.L(eDEBUG_LEVELS.OFF) ? null : new TSM(MyBaseEngine.GetEngineName(), "NMI Interceptor registered", eMsgLevel.l3_ImportantMessage));

                if (TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("RedPill")))
                {
                    TheThing MyLiveThing = TheThingRegistry.GetThingByProperty(eEngineName.NMIService, Guid.Empty, "DeviceType", "NMI Editor");
                    var MyNMIEditor = new TheNMIEditor(MyLiveThing);
                    TheThingRegistry.RegisterThing(MyNMIEditor);
                }
                TheCDEngines.MyNMIService.RegisterEvent(eEngineEvents.IncomingMessage, SinkNMIMessage);
                MyBaseThing.LastMessage = "NMI Runtime started...";
                MyBaseEngine.ProcessInitialized(); //Set the status of the Base Engine according to the status of the Things it manages
                MyBaseEngine.SetStatusLevel(1);
            }
            else
                MyBaseEngine.SetStatusLevel(0);
            return true;
        }

        void SinkNMIMessage(ICDEThing psender, object pIncoming)
        {
            if (!(pIncoming is TheProcessMessage pMsg)) return;
            switch (pMsg.Message.TXT)   //string 2 cases
            {
                case "NMI_NODEPING":
                    bool IsAuto = IsAutoTheme;
                    if (!string.IsNullOrEmpty(pMsg.Message.PLS))
                    {
                        try
                        {
                            var u = TheCommonUtils.DeserializeJSONStringToObject<Dictionary<string, object>>(pMsg.Message.PLS);
                            if (u.TryGetValue("ThemeName", out object tname))
                            {
                                if (TheCommonUtils.CStr(tname) == "Auto")
                                    IsAuto = true;
                            }
                        }
                        catch (Exception)
                        { 
                            //Intentionally blank
                        }
                    }
                    if (IsAuto)
                    {
                        if (SunriseSunset == null || SunriseSunset.Sunrise.Day != DateTimeOffset.Now.Day) //Calculate once a day
                            SunriseSunset = SolarCalculator.Calculate();

                        if (IsLightTheme != (DateTimeOffset.Now > SunriseSunset.Sunrise && DateTimeOffset.Now < SunriseSunset.Sunset))
                        {
                            IsLightTheme = !IsLightTheme;
                            TheCommCore.PublishToOriginator(pMsg.Message, new TSM(eEngineName.NMIService, "NMI_THEME", IsLightTheme.ToString()));
                        }
                    }
                    break;
            }
        }



        private void OnDownloadClick(ICDEThing pThing, object pPara)
        {
            TheProcessMessage pMSG = (TheProcessMessage)pPara;
            if (pMSG == null || pMSG.Message == null) return;

            string[] cmd = pMSG.Message.PLS.Split(':');
            if (cmd.Length > 2)
            {
                TheThing tThing = TheThingRegistry.GetThingByMID("*", TheCommonUtils.CGuid(cmd[2]), true);
                if (tThing == null) return;

                TSM tFilePush = new TSM(eEngineName.ContentService, string.Format("CDE_FILE:{0}.JSON:application/json", tThing.FriendlyName))
                {
                    SID = pMSG.Message.SID,
                    PLS = "bin",
                    PLB = TheCommonUtils.CUTF8String2Array(TheCommonUtils.SerializeObjectToJSONString(tThing))
                };
                TheCommCore.PublishToOriginator(pMSG.Message, tFilePush);
            }
        }

        private void OnExportClick(ICDEThing pThing, object pPara, bool bGeneralize, bool bRemoveDefaultedValuesFromConfig, bool bAnswer, bool createCDEF)
        {
            TheProcessMessage pMSG = (TheProcessMessage)pPara;
            if (pMSG == null || pMSG.Message == null) return;

#if !CDE_NET4 && !CDE_NET35
            string[] cmd = pMSG.Message.PLS.Split(':');
            if (cmd.Length > 2)
            {
                TheThing tThing = TheThingRegistry.GetThingByMID("*", TheCommonUtils.CGuid(cmd[2]), true);
                if (tThing == null) return;

                var pipelineConfig = tThing.GetThingPipelineConfigurationAsync(bGeneralize).Result;
                if (pipelineConfig == null)
                {
                    return;
                }

                TheThing.ThePipelineConfiguration answerConfig;
                if (bAnswer || bRemoveDefaultedValuesFromConfig)
                {
                    // This also removes all settings from the pipeline config
                    answerConfig = TheThing.GeneratePipelineAnswerConfiguration(pipelineConfig, bRemoveDefaultedValuesFromConfig);
                }
                else
                {
                    answerConfig = null;
                }
                var nameRoot = $"{tThing.FriendlyName}";
                if (createCDEF)
                {
                    var zipStream = new MemoryStream();
                    var zipArchive = new System.IO.Compression.ZipArchive(zipStream, System.IO.Compression.ZipArchiveMode.Create);

                    string fileName;
                    if (!bAnswer)
                    {
                        fileName = $"{nameRoot} V1.0000.CDEF";

                        var configEntry = zipArchive.CreateEntry(Path.Combine("config", $"{nameRoot}.cdeconfig"));
                        using (var configStream = configEntry.Open())
                        {
                            var configBytes = TheCommonUtils.CUTF8String2Array(TheCommonUtils.SerializeObjectToJSONString(pipelineConfig));
                            configStream.Write(configBytes, 0, configBytes.Length);
                            configStream.Flush();
                            configStream.Close();
                        }
                    }
                    else
                    {
                        fileName = $"{nameRoot} Instance01 V1.0000.CDEF";
                        var answerEntry = zipArchive.CreateEntry(Path.Combine("config", $"{nameRoot}.Instance01.cdeanswer"));
                        using (var answerStream = answerEntry.Open())
                        {
                            var answerBytes = TheCommonUtils.CUTF8String2Array(TheCommonUtils.SerializeObjectToJSONString(answerConfig));
                            answerStream.Write(answerBytes, 0, answerBytes.Length);
                            answerStream.Flush();
                            answerStream.Close();
                        }
                    }
                    zipArchive.Dispose();
                    var zipBytes = zipStream.GetBuffer();

                    TSM tFilePush = new TSM(eEngineName.ContentService, string.Format("CDE_FILE:{0}:application/zip", fileName))
                    {
                        SID = pMSG.Message.SID,
                        PLS = "bin",
                        PLB = zipBytes,
                    };
                    TheCommCore.PublishToOriginator(pMSG.Message, tFilePush);

                }
                else
                {
                    if (!bAnswer)
                    {
                        var fileName = $"{tThing.FriendlyName}.cdeconfig";

                        TSM tFilePush = new TSM(eEngineName.ContentService, string.Format("CDE_FILE:{0}:application/json", fileName))
                        {
                            SID = pMSG.Message.SID,
                            PLS = "bin",
                            PLB = TheCommonUtils.CUTF8String2Array(TheCommonUtils.SerializeObjectToJSONString(pipelineConfig))
                        };
                        TheCommCore.PublishToOriginator(pMSG.Message, tFilePush);
                    }
                    else
                    {
                        var fileName = $"{nameRoot} Instance01 V1.0000.cdeanswer";
                        TSM tFilePush = new TSM(eEngineName.ContentService, string.Format("CDE_FILE:{0}:application/json", fileName))
                        {
                            SID = pMSG.Message.SID,
                            PLS = "bin",
                            PLB = TheCommonUtils.CUTF8String2Array(TheCommonUtils.SerializeObjectToJSONString(answerConfig))
                        };
                        TheCommCore.PublishToOriginator(pMSG.Message, tFilePush);

                    }
                }
            }
#endif
        }

        public override void HandleMessage(ICDEThing sender, object pIncoming)
        {
            TheProcessMessage pMsg = (TheProcessMessage)pIncoming;
            if (pMsg == null) return;
            switch (pMsg.Message.TXT)   //string 2 cases
            {
                case "CDE_INITIALIZED":
                    MyBaseEngine.SetInitialized(pMsg.Message);
                    break;
                //If the Service receives an "INITIALIZE" it fires up all its code and sends INITIALIZED back
                case "CDE_INITIALIZE":
                    if (MyBaseEngine.GetEngineState().IsService)
                    {
                        if (!MyBaseEngine.GetEngineState().IsEngineReady)
                            MyBaseEngine.SetEngineReadiness(true, null);
                        MyBaseEngine.ReplyInitialized(pMsg.Message);
                    }
                    break;
            }
        }


        private void CreateUserPreferences()
        {
            UserPrefID = new Guid("{E15AE1F2-69F3-42DC-97E8-B0CC2A8526A6}").ToString().ToLower();
            TheFormInfo tMyUserSettingsForm = new TheFormInfo(TheCommonUtils.CGuid(UserPrefID), eEngineName.NMIService, "My Account", "TheUserDetails;:;0;:;True;:;cdeMID=%SESS:CID%") { DefaultView = eDefaultView.Form, GetFromFirstNodeOnly = true, PropertyBag = new nmiCtrlFormView { TileWidth = 13 } };
            TheNMIEngine.AddFormToThingUX(MyBaseThing, tMyUserSettingsForm, "CMyForm", "<span class='fa fa-5x'>&#xf013;</span></br>My Account", 1, 0x89, 0, "NMI Administration", null, null);
            CreateUserFields(tMyUserSettingsForm, false);
        }

        private void CreateUserTemplate()
        {
            TheFormInfo tMyUserSettingsForm = new TheFormInfo(TheCommonUtils.CGuid("{D270C52C-43AB-4613-9E92-8E08C60526E8}"), eEngineName.NMIService, "Account Settings", null) { DefaultView = eDefaultView.Form, GetFromFirstNodeOnly = true, IsAlwaysEmpty = true, IsPostingOnSubmit = true, TableReference = UserManID, PropertyBag = new nmiCtrlFormView { TileWidth = 13 } };
            TheNMIEngine.AddFormToThingUX(MyBaseThing, tMyUserSettingsForm, "CMyForm", "<span class='fa fa-5x'>&#xf013;</span></br>My Account", 1, 0x89, 0, "NMI Administration", null, new nmiDashboardTile { Visibility = false });
            CreateUserFields(tMyUserSettingsForm, true);
        }

        private void CreateUserFields(TheFormInfo tMyUserSettingsForm, bool IsAdmin)
        {
            //user settings 
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.CollapsibleGroup, 10, 2, 0, "Account Settings", null, new nmiCtrlCollapsibleGroup() { TileWidth = 6, DoClose = false, IsSmall = true });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 20, 2, 0, "Name", "Name", new nmiCtrlSingleEnded() { TileHeight = 1, TileWidth = 6, FldWidth = 4, ParentFld = 10 });

            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.eMail, 40, 2, 0, "Email", "EMail", new nmiCtrlSingleEnded() { TileHeight = 1, TileWidth = 6, ParentFld = 10 });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.Password, 50, 3, 0, "Password", "Password", new nmiCtrlPassword() { TileHeight = !IsAdmin ? 3 : 2, TileWidth = 6, ParentFld = 10, EnforceAndConfirm = true, RequireUpdateButton = !IsAdmin });
            if (TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("AllowPinLogin")))
            {
                var Teto = TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SmartLabel, 55, 0, 0, "Your TeTo:", "TeTo", new nmiCtrlSmartLabel() { ParentFld = 10, FontSize = 50, Foreground = "green", TileHeight = 1, TileFactorY = 1 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.Password, 56, 3, 0, "Enter new Pin", "TempPin", new nmiCtrlPassword() { TileHeight = 1, TileWidth = 6, ParentFld = 10 });
                GetProperty("TempPin", true).RegisterEvent2(eThingEvents.PropertyChangedByUX, (msg, sender) =>
                {
                    Teto.SetUXProperty(msg.Message.GetOriginator(), $"Text={TheThing.GetSafePropertyString(MyBaseThing, "TeTo")}");
                });
            }
            if (IsAdmin)
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.CheckField, 70, 3, 128, "User Access Level", "AccessMask", ThePropertyBag.Create(new nmiCtrlCheckField() { MID = new Guid("{DD3DF621-ACAC-4B77-9856-87165138B028}"), Bits = 8, TileWidth = 6, FontSize = 24, ParentFld = 10, TileFactorY = 2, Options = "Service Guest;IT Guest;OT User;Service User;IT User;OT Admin; Service Admin;IT Admin" })); //, Options="A;B;C;D;E;F;G;H" 

            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.CollapsibleGroup, 100, 2, 0, "My Account", null, new nmiCtrlCollapsibleGroup() { TileWidth = 6, DoClose = false, IsSmall = true });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SmartLabel, 105, 2, 0, "Important:", null, new nmiCtrlSmartLabel() { ParentFld = 100, Text = "Changes made here require you to log-out/log-in to get in effect", FontSize = 20, Foreground = "red" });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.ComboBox, 110, 2, 0, "Preferred Language", "LCID", new nmiCtrlComboBox() { TileHeight = 1, TileWidth = 6, ParentFld = 100, Options = "Browser:0;English:1033;Deutsch:1031" });
            var HomeScreenField = TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.ComboBox, 120, 2, 0xe0, "Home Screen", "HomeScreen", new nmiCtrlComboBox() { TileHeight = 1, TileWidth = 6, ParentFld = 100, Options = "SCREENPICKER;Main Portal:%MAINDASHBOARD%;%GetNMIViews%" });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleCheck, 130, 2, 0, "Use Classic Portal", "ShowClassic", new nmiCtrlSingleCheck() { TileHeight = 1, TileWidth = 3, ParentFld = 100 });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleCheck, 140, 2, 0, "Speak Toasts", "SpeakToasts", new nmiCtrlSingleCheck() { TileHeight = 1, TileWidth = 3, ParentFld = 100 });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleCheck, 150, 2, 0, "Show Tooltips", "ShowToolTipsInTable", new nmiCtrlSingleCheck() { TileHeight = 1, TileWidth = 6, ParentFld = 100 });
            TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.ComboBox, 160, 2, 0, "Color Scheme", "ThemeName", new nmiCtrlComboBox() { TileHeight = 1, TileWidth = 6, ParentFld = 100, Options = "Lite;Dark;Auto;Browser" });

            tMyUserSettingsForm.RegisterEvent2(eUXEvents.OnBeforeLoad, (pMSG, obj) =>
            {
                HomeScreenField.SetUXProperty(pMSG.Message.GetOriginator(), TheCommonUtils.GenerateFinalStr("Options=SCREENPICKER;Main Portal:%MAINDASHBOARD%;%GetNMIViews%"));
            });

            if (IsAdmin)
            {
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.CollapsibleGroup, 800, 130, 128, "User Info", null, new nmiCtrlCollapsibleGroup() { TileWidth = 12, DoClose = true, IsSmall = true });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 810, 128, 128, "User ID", null, new nmiCtrlComboBox() { DataItem = "cdeMID", ParentFld = 800 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 820, 128, 128, "Last User Update", null, new nmiCtrlComboBox() { DataItem = "cdeCTIM", ParentFld = 800 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 830, 128, 128, "Host Node", "HomeNodeName", new nmiCtrlComboBox() { ParentFld = 800 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 840, 128, 128, "Application Name", "ApplicationName", new nmiCtrlComboBox() { ParentFld = 800 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 850, 128, 128, "Primary DeviceID", "PrimaryDeviceID", new nmiCtrlComboBox() { ParentFld = 800 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 855, 128, 128, "Node ID", "cdeN", new nmiCtrlSingleEnded() { ParentFld = 800 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 860, 128, 128, "Node Scope", "NodeScope", new nmiCtrlComboBox() { ParentFld = 800 });
                TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.SingleEnded, 870, 128, 128, "Primary Role", "PrimaryRole", new nmiCtrlComboBox() { ParentFld = 800 });
                var but = TheNMIEngine.AddSmartControl(MyBaseThing, tMyUserSettingsForm, eFieldType.TileButton, 880, 130, 128, "Request User's ACL", null, new nmiCtrlComboBox() { NoTE = true, ParentFld = 800 });
                but.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "REQLEV", (sender, para) =>
                {
                    var tMsg = (TheProcessMessage)para;
                    if (tMsg == null)
                        return;
                    if (!TheUserManager.SendACLToNMI(tMsg.Message.GetOriginator(), TheCommonUtils.CGuid(tMsg.Message.PLS.Split(':')[2]), tMsg.ClientInfo))
                        TheCommCore.PublishToNode(tMsg.Message.GetOriginator(), new TSM(eEngineName.NMIService, "NMI_INFO", $"Access denied or user not found"));
                });
                TheNMIEngine.AddTemplateButtons(MyBaseThing, tMyUserSettingsForm, -1, 10, 0);
                tMyUserSettingsForm.RegisterEvent2(eUXEvents.OnShow, (tMsg, args) =>
                {
                    if (tMsg?.Message?.TXT?.Split(':')?.Length < 2)
                        return;
                    TheUserManager.SendACLToNMI(TheCommonUtils.CGuid(tMsg?.Message?.GetOriginator()), TheCommonUtils.CGuid(tMsg?.Message?.TXT?.Split(':')[1]), tMsg?.ClientInfo, true);
                });
            }
        }
    }
}
