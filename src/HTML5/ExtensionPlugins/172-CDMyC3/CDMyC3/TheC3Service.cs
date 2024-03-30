// SPDX-FileCopyrightText: 2009-2024 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

using nsCDEngine.BaseClasses;
using nsCDEngine.Engines;
using nsCDEngine.Engines.NMIService;
using nsCDEngine.Engines.ThingService;
using nsCDEngine.ViewModels;
using System;
using System.Collections.Generic;

namespace CDMyC3
{
    class TheC3Service : ThePluginBase
    {
        // User-interface defintion
        TheDashboardInfo mMyDashboard;

        Guid guidEngineID = new Guid("{F23455E5-24FE-4909-AED5-339DA8026379}");
        string strFriendlyName = "My C3 wrapper NMI Service";

        #region ICDEPlugin - interface methods for service (engine)
        public override void InitEngineAssets(IBaseEngine pBase)
        {
            base.InitEngineAssets(pBase);
            MyBaseEngine.SetEngineID(guidEngineID);
            MyBaseEngine.SetFriendlyName(strFriendlyName);
            MyBaseEngine.RegisterJSEngine(null);
            MyBaseEngine.AddCapability(eThingCaps.NMIControls);
            MyBaseEngine.SetPluginInfo("This plugin wraps the C3 controls in NMI Controls",       // Describe plugin for Plugin Store
                                       0,                       // pPrice - retail price (default = 0)
                                       null,                    // Custom home page - default = /ServiceID
                                       "toplogo-150.png",       // pIcon - custom icon.
                                       "C-Labs",                // pDeveloper - name of the plugin developer.
                                       "http://www.c-labs.com", // pDeveloperUrl - URL to developer home page.
                                       new List<string> { "NMI Extension" }); // pCategories - Search categories for service.
        }
        #endregion

        public override bool Init()
        {
            if (!mIsInitCalled)
            {
                mIsInitCalled = true;
                //TheChartFactory.MyDefaultChartsFactory = new TheC3ChartsFactory();
                MyBaseThing.LastMessage = "Service has started";
                MyBaseThing.AddCapability(eThingCaps.NMIControls);
                MyBaseThing.RegisterEvent(eEngineEvents.IncomingMessage, HandleMessage);
                MyBaseEngine.ProcessInitialized();
                MyBaseEngine.SetEngineReadiness(true, null);
                MyBaseEngine.SetStatusLevel(1);
                mIsInitialized = true;
            }
            return true;
        }

        public override bool CreateUX()
        {
            if (!mIsUXInitCalled)
            {
                mIsUXInitCalled = true;
                TheNMIEngine.RegisterControlType(MyBaseEngine, "C3 Chart", "CDMyC3.ctrlC3Chart", "CDMyC3.ctrlC3Chart");
                TheNMIEngine.RegisterControlType(MyBaseEngine, "Time Line Chart", "CDMyC3.ctrlTimeLineChart", "CDMyC3.ctrlTimeLineChart");
                TheNMIEngine.RegisterControlType(MyBaseEngine, "Live Chart", "CDMyC3.ctrlProLiveChart");
                TheNMIEngine.RegisterControlType(MyBaseEngine, "Stack Chart", "CDMyC3.ctrlC3StackChart");
                TheNMIEngine.RegisterControlType(MyBaseEngine, "Cyto Chart", "CDMyC3.ctrlProCytoChart");
                TheNMIEngine.RegisterControlType(MyBaseEngine, "Line Chart", "CDMyC3.ctrlC3Line");
                //NUI Definition for All clients

                if (TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("ShowSamples")))
                {
                    mMyDashboard = TheNMIEngine.AddDashboard(MyBaseThing, new TheDashboardInfo(MyBaseEngine, "C3 Charts") { FldOrder = 7010, PropertyBag = new ThePropertyBag() { "Category=NMI Extensions", "HideShowAll=true", "Caption=<span style='font-size:64px'>C3</span><br>Charts" } });
                    TheFormInfo tMyForm = TheNMIEngine.AddForm(new TheFormInfo(MyBaseThing) { FormTitle = "C3 Samples Page", DefaultView = eDefaultView.Form });
                    TheNMIEngine.AddFormToThingUX(MyBaseThing, tMyForm, "CMyForm", "My Sample Form", 3, 3, 0, TheNMIEngine.GetNodeForCategory(), null, null);

                    TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.CollapsibleGroup, 10, 2, 0, "Value Tester", null, new nmiCtrlCollapsibleGroup { TileWidth = 6, ClassName = "AXGroup", IsSmall = true });
                    TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.SingleEnded, 11, 2, 0, "My Sample Value Is", "SampleProperty", new nmiCtrlSingleEnded { ParentFld=10 });
                    TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.BarChart, 12, 2, 0, "My Sample Value Bar", "SampleProperty", new nmiCtrlBarChart() { ParentFld=10, MaxValue = 255, TileHeight = 2 });

                    //TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.CollapsibleGroup, 29, 2, 0, "Pie Demo", null, new nmiCtrlCollapsibleGroup { /*TileHeight = 5, */TileWidth = 6, ClassName = "AXGroup", IsSmall = true });
                    //TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.UserControl, 30, 2, 0, "My Pie", "SampleProperty", new ctrlC3Chart { ChartType="pie", UpdateData = true, NoTE = true, ParentFld = 29, TileHeight = 4, TileWidth = 6, SetSeries = "[[\"Dogs\", 100],[\"Cats\", 20],[\"Birds\", 34]]" });

                    //TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.CollapsibleGroup, 34, 2, 0, "Pie Demo", null, new nmiCtrlCollapsibleGroup { /*TileHeight = 5, */TileWidth = 6, ClassName = "AXGroup", IsSmall = true });
                    //TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.UserControl, 35, 2, 0, "My Gauge", "SampleProperty", new ctrlC3Chart { ChartType="gauge", UpdateData = true, TileHeight = 4, ParentFld = 34, MaxValue = 255, TileWidth = 6, SetSeries = "[[\"Dogs\", 100]]" });

                    TheNMIEngine.AddSmartControl(MyBaseThing, tMyForm, eFieldType.CollapsibleGroup, 39, 2, 0, "Chart Demo", null, new nmiCtrlCollapsibleGroup { /*TileHeight = 5, */TileWidth = 12, ClassName = "AXGroup", IsSmall = true });
                    ctrlC3Chart.AddC3Chart(MyBaseThing, tMyForm, 50, 39,true, new ctrlC3Chart { NoTE=true, TileHeight = 4, ParentFld = 39, ChartType = "bar", TileWidth = 12, SetSeries = "[[\"Dogs\", 100],[\"Cats\", 20],[\"Birds\", 34]]", Group= "[[\"Dogs\", \"Cats\"]]" });

                    TheNMIEngine.AddAboutButton(MyBaseThing);
                }

                TheNMIEngine.RegisterEngine(MyBaseEngine);
                mIsUXInitialized = true;
            }
            return true;
        }

        /// <summary>
        /// Handles Messages sent from a host sub-engine to its clients
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="pIncoming"></param>
        public override void HandleMessage(ICDEThing sender, object pIncoming)
        {
            TheProcessMessage pMsg = pIncoming as TheProcessMessage;
            if (pMsg == null) return;

            string[] cmd = pMsg.Message.TXT.Split(':');
            switch (cmd[0])
            {
                case "CDE_INITIALIZED":
                    MyBaseEngine.SetInitialized(pMsg.Message);
                    break;
                case "GET_CHARTDATA":
                    Type td = typeof(CDMyC3.TheC3ChartsFactory);
                    TheChartFactory.PushChartsData(TheCommonUtils.CGuid(pMsg.Message.PLS), pMsg.Message.GetOriginator(), td.AssemblyQualifiedName);
                    break;
                default:
                    break;
            }
        }
    }
}
