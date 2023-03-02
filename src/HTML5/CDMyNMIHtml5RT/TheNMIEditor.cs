// SPDX-FileCopyrightText: 2009-2023 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿using nsCDEngine.BaseClasses;
using nsCDEngine.Communication;
using nsCDEngine.Engines.NMIService;
using nsCDEngine.Engines.ThingService;
using nsCDEngine.ViewModels;
using System;

namespace NMIService
{
    public class TheNMIEditor : TheThingBase
    {
        public override bool Init()
        {
            if (mIsInitCalled) return false;
            mIsInitCalled = true;
            MyBaseThing.EngineName = eEngineName.NMIService;
            MyBaseThing.DeviceType = "NMI Editor";
            TheThing.SetSafePropertyBool(MyBaseThing, "IsLiveTag", true);
            MyBaseThing.FireEvent("OnInitialized", this, new TSM(MyBaseThing.cdeMID.ToString(), "Was Init"), false);
            cdeP tThrot = GetProperty("Throttle", true);
            tThrot.RegisterEvent(eThingEvents.PropertyChanged, sinkThrottleChanged);
            mIsInitialized = DoInit();    //we have to follow your design to have mIsINitialzed called at the end. This can lead to problems for live tags
            if (string.IsNullOrEmpty(MyBaseThing.ID))
                MyBaseThing.ID = Guid.NewGuid().ToString();
            return mIsInitialized;
        }

        public virtual bool DoInit()
        {
            return true;
        }

        public virtual void sinkThrottleChanged(cdeP pNewValue)
        {
            MyBaseThing.SetPublishThrottle(TheCommonUtils.CInt(pNewValue));
        }

        public override bool CreateUX()
        {
            if (mIsUXInitCalled) return false;
            mIsUXInitCalled = true;
            return mIsUXInitialized = DoCreateUX();
        }

        protected TheFormInfo MyEditorForm;
        protected TheDashPanelInfo MyEditorDashIcon;
        protected TheFieldInfo MySampleControl = null;
        protected Guid MapperGuid;

        private void SetCtrlType()
        {
            if (MySampleControl == null) return;
            string tControl = ThePropertyBag.PropBagGetValue(MySampleControl.PropertyBag, "ControlType", "=");
            eFieldType tCtrlType = eFieldType.SingleEnded;
            if (!string.IsNullOrEmpty(tControl) && TheCommonUtils.CInt(tControl) == 0 && tControl.Length > 0)
            {
                TheControlType tType = TheNMIEngine.GetControlTypeByType(tControl);
                if (tType != null)
                    ThePropertyBag.PropBagUpdateValue(MySampleControl.PropertyBag, "EngineName", "=", tType.BaseEngineName);
                tCtrlType = eFieldType.UserControl;
            }
            else
                tCtrlType = (eFieldType)TheCommonUtils.CInt(tControl);
            MySampleControl.Type = tCtrlType;
            MySampleControl.Flags = TheCommonUtils.CInt(ThePropertyBag.PropBagGetValue(MySampleControl.PropertyBag, "Flags", "="));
            MySampleControl.UpdateUXProperties(Guid.Empty);
        }
        private void UpdateUx(TheThing pThing)
        {
            ThePropertyBag.MergeUXBagFromProperties(MySampleControl?.PropertyBag, pThing);
            SetCtrlType();

            TheThingRegistry.UnmapPropertyMapper(MapperGuid);
            if (!string.IsNullOrEmpty(pThing.Address))
            {
                MapperGuid = TheThingRegistry.PropertyMapper(TheCommonUtils.CGuid(pThing.Address), TheThing.GetSafePropertyString(pThing, "SourceProp"), pThing.cdeMID, "Value", true);
                if (MapperGuid != Guid.Empty)
                {
                    pThing.StatusLevel = 1;
                    pThing.LastMessage = "Mapper engaged";
                }
                else
                {
                    pThing.StatusLevel = 2;
                    pThing.LastMessage = "Mapper failed to engaged";
                }
            }
            else
            {
                pThing.StatusLevel = 0;
                pThing.LastMessage = "Mapper not engaged";
            }
        }

        public virtual bool DoCreateUX()
        {
            return true; //retired for now. Moved into NMI Control Code
            MyEditorForm = new TheFormInfo(MyBaseThing) { DefaultView = eDefaultView.Form, PropertyBag = new ThePropertyBag { "MaxTileWidth=6", "HideCaption=true", "AllowDrag=true" } };
            MyEditorForm.ModelID = "NMIEditor";

            TheDashboardInfo tDash = TheNMIEngine.GetDashboardById(TheNMIHtml5RT.eNMIDashboard);
            MyEditorDashIcon = TheNMIEngine.AddFormToThingUX(tDash, MyBaseThing, MyEditorForm, "CMyForm", "NMI Control Editor", 1, 0x89, 0x80, "NMI", null, new ThePropertyBag() { "RenderTarget=cdeInSideBarRight", "NeverHide=true" }); //"mAllowDrag=true", "nVisibility=false", 

            MySampleControl = TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.SingleEnded, 3, 2, MyBaseThing.cdeA, "CurrentValue", "Value", null);


            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileGroup, 9, 0, 0, null, null, new nmiCtrlTileGroup { TileWidth = 7, TileHeight = 1, TileFactorY = 2  });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileButton, 10, 2, 0, "Basic", null, new nmiCtrlTileButton { ParentFld=9, OnClick = "GRP:NMIP:Basic", TileWidth = 1, TileHeight = 1, TileFactorY = 2, NoTE = true, ClassName = "cdeTransitButton" });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileButton, 20, 2, 0, "Screen", null, new nmiCtrlTileButton { ParentFld = 9, OnClick = "GRP:NMIP:Screen", TileWidth = 1, TileHeight = 1, TileFactorY = 2, NoTE = true, ClassName = "cdeTransitButton" });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileButton, 30, 2, 0, "All", null, new nmiCtrlTileButton { ParentFld = 9, OnClick = "GRP:NMIP:All", TileWidth = 1, TileHeight = 1, TileFactorY = 2, NoTE = true, ClassName = "cdeTransitButton" });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileButton, 40, 2, 0, "Source", null, new nmiCtrlTileButton { ParentFld = 9, OnClick = "GRP:NMIP:Source", TileWidth = 1, TileHeight = 1, TileFactorY = 2, NoTE = true, ClassName = "cdeTransitButton" });
            TheFieldInfo mSendbutton = TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileButton, 70, 2, 0x80, "Reload", false, "", null, new nmiCtrlTileButton() { ParentFld=9, TileWidth = 2, NoTE = true, TileFactorY = 2, ClassName = "cdeGoodActionButton" });
            mSendbutton.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "", (pThing, pPara) =>
            {
                TheProcessMessage pMsg = pPara as TheProcessMessage;
                if (pMsg?.Message == null) return;
                UpdateUx(pThing.GetBaseThing());
                MyEditorForm.Reload(pMsg, tDash.cdeMID, true);
            });

            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileGroup, 1000, 2, 0x80, null, null, new nmiCtrlTileGroup() { Group = "NMIP:Basic" });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.ComboBox, 1010, 2, 0x80, "Control Type", "ControlType", new ThePropertyBag() { "Options=%RegisteredControlTypes%", "ParentFld=1000" });
            GetProperty("ControlType", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                UpdateUx(MyBaseThing);
            });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.Number, 1020, 2, 0, "Tile Width", "TileWidth", new nmiCtrlNumber() { ParentFld = 1000, TileHeight=1, TileFactorY=1, DefaultValue="6", TileWidth=3 });
            GetProperty("TileWidth", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                MySampleControl.SetUXProperty(Guid.Empty, "TileWidth= " + p.ToString());
            });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.Number, 1030, 2, 0, "Tile Height", "TileHeight", new nmiCtrlNumber() { ParentFld = 1000, TileHeight = 1, TileFactorY = 1, DefaultValue = "1", TileWidth = 3 });
            GetProperty("TileHeight", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                MySampleControl.SetUXProperty(Guid.Empty, "TileHeight= " + p.ToString());
            });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.ComboBox, 1040, 2, 0, "Horizontal Alignment", "HorizontalAlignment", new nmiCtrlComboBox() { ParentFld = 1000, Options = ";left;center;right" });
            GetProperty("HorizontalAlignment", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                MySampleControl.SetUXProperty(Guid.Empty, "HorizontalAlignment= " + p.ToString());
            });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.ComboBox, 1050, 2, 0, "Class Name", "ClassName", new nmiCtrlComboBox() { ParentFld = 1000, Options = ";BlueWhite;GreenYellow;RedWhite" });
            GetProperty("ClassName", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                MySampleControl.SetUXProperty(Guid.Empty, "ClassName= " + p.ToString());
            });

            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.SingleEnded, 1060, 2, 0, "HelpText", "HelpText", new nmiCtrlSingleEnded() { ParentFld = 1000 });
            GetProperty("HelpText", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                MySampleControl.SetUXProperty(Guid.Empty, "HelpText= " + p.ToString());
            });

            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.ComboBox, 1070, 2, 0, "Opacity", "Opacity", new nmiCtrlComboBox() { ParentFld = 1000, Options = ";0.1;0.3;0.5;0.7;0.9;1.0" });
            GetProperty("Opacity", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                MySampleControl.SetUXProperty(Guid.Empty, "Opacity= " + p.ToString());
            });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.SingleCheck, 1080, 2, 0, "No TE", "NoTE", new nmiCtrlSingleCheck() { ParentFld = 1000 });
            GetProperty("NoTE", true).RegisterEvent(eThingEvents.PropertyChanged, (p) =>
            {
                MySampleControl.SetUXProperty(Guid.Empty, "NoTE= " + p.ToString());
            });


            //Screen Properties
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileGroup, 3000, 2, 0x80, null, null, new nmiCtrlTileGroup() { Group = "NMIP:Screen", Visibility = false });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.ComboOption, 3010, 2, 0x80, "NMI Screen", "FormName", new ThePropertyBag() { "Options=%GetLiveScreens%", "TileWidth=6", "TileHeight=1", "ParentFld=3000" });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.CheckField, 3020, 2, 0x80, "Flags", "Flags", new ThePropertyBag() { "Bits=6", "TileHeight=6", "TileFactorY=2",
                      "ImageList=<span class='fa-stack'><i class='fa fa-stack-1x'>&#xf21b;</i><i class='fa fa-stack-2x'>&#x2003;</i></span>,"+
                                "<span class='fa-stack'><i class='fa fa-stack-1x'>&#xf044;</i><i class='fa fa-stack-2x'>&#x2003;</i></span>,"+
                                "<span class='fa-stack'><i class='fa fa-stack-1x'>&#xf10b;</i><i class='fa fa-stack-2x text-danger' style='opacity:0.5'>&#xf05e;</i></span>,"+
                                "<span class='fa-stack'><i class='fa fa-stack-1x'>&#xf0ce;</i><i class='fa fa-stack-2x text-danger' style='opacity:0.5'>&#xf05e;</i></span>,"+
                                "<span class='fa-stack'><i class='fa fa-stack-1x'>&#xf0f6;</i><i class='fa fa-stack-2x text-danger' style='opacity:0.5'>&#xf05e;</i></span>,"+
                                "<span class='fa-stack'><i class='fa fa-stack-1x'>&#xf15c;</i><i class='fa fa-stack-2x text-danger' style='opacity:0.5'>&#xf05e;</i></span>","ParentFld=3000" }).FldWidth = 1;

            //ALL Properties
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileGroup, 2000, 2, 0x80, null, null, new nmiCtrlTileGroup() { TileWidth = 6, Group = "NMIP:All", Visibility = false });

            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.Table, 2010, 0xA2, 0x80, "All Properties", "mypropertybag;1", new ThePropertyBag() { "NoTE=true", "TileHeight=4", "TileLeft=9", "TileTop=3", "TileWidth=6", "FldWidth=6", "ParentFld=2000" });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.SingleEnded, 2020, 0x0A, 0, "New Property Name", "ScratchName", new nmiCtrlSingleEnded() { ParentFld = 2000 });
            TheFieldInfo tBut = TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileButton, 2040, 0x0A, 0, "Add Property", false, null, null, new nmiCtrlTileButton() { ParentFld = 2000, NoTE = true, ClassName = "cdeGoodActionButton" });
            tBut.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "AddProp", (pThing, pObj) =>
            {
                TheProcessMessage pMsg = pObj as TheProcessMessage;
                if (pMsg?.Message == null) return;
                TheThing tOrg = pThing.GetBaseThing(); 

                string tNewPropName = TheThing.GetSafePropertyString(tOrg, "ScratchName");
                if (string.IsNullOrEmpty(tNewPropName))
                    TheCommCore.PublishToOriginator(pMsg.Message, new TSM(eEngineName.NMIService, "NMI_TOAST", "Please specify a new property name"));
                else
                {
                    if (tOrg.GetProperty(tNewPropName) != null)
                    {
                        TheCommCore.PublishToOriginator(pMsg.Message, new TSM(eEngineName.NMIService, "NMI_TOAST", "Property already exists"));
                    }
                    else
                    {
                        tOrg.DeclareNMIProperty(tNewPropName, ePropertyTypes.TString);
                        TheCommCore.PublishToOriginator(pMsg.Message, new TSM(eEngineName.NMIService, "NMI_TOAST", "Property Added"));
                        MyEditorForm.Reload(pMsg, false);
                    }
                    tOrg.SetProperty("ScratchName", "");
                }
            });

            //THING Connector
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileGroup, 5000, 2, 0x80, null, null, new nmiCtrlTileGroup() { TileWidth = 6, Group = "NMIP:Source", Visibility = false });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.ThingPicker, 5010, 2, 0x80, "Source Thing", "Address", new nmiCtrlThingPicker() { ParentFld = 5000, IncludeEngines = true });
            TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.PropertyPicker, 5020, 2, 0x80, "Source Property", "SourceProp", new nmiCtrlPropertyPicker() { ParentFld = 5000, ThingFld = 5010 });

            TheFieldInfo mSendbutton2 = TheNMIEngine.AddSmartControl(MyBaseThing, MyEditorForm, eFieldType.TileButton, 5050, 2, 0x80, "Engage", false, "", null, new nmiCtrlTileButton() { NoTE = true, TileWidth = 6, ClassName = "cdeGoodActionButton", ParentFld = 5000 });
            mSendbutton2.RegisterUXEvent(MyBaseThing, eUXEvents.OnClick, "", (pThing, pPara) =>
            {
                TheProcessMessage pMsg = pPara as TheProcessMessage;
                if (pMsg?.Message == null) return;
                UpdateUx(pThing.GetBaseThing());
            });
            UpdateUx(MyBaseThing);
            return true;
        }

        private void OnDownloadClick(ICDEThing pThing, object pPara)
        {
            TheProcessMessage pMSG = pPara as TheProcessMessage;
            if (pMSG == null || pMSG.Message == null) return;

            string[] cmd = pMSG.Message.PLS.Split(':');
            if (cmd.Length > 2)
            {
                TheThing tThing = TheThingRegistry.GetThingByMID("*", TheCommonUtils.CGuid(cmd[2]), true);
                if (tThing == null) return;

                TSM tFilePush = new TSM(eEngineName.ContentService, string.Format("CDE_FILE:{0}.JSON:application/zip", tThing.FriendlyName))
                {
                    SID = pMSG.Message.SID,
                    PLS = "bin",
                    PLB = TheCommonUtils.CUTF8String2Array(TheCommonUtils.SerializeObjectToJSONString(tThing))
                };
                TheCommCore.PublishToOriginator(pMSG.Message, tFilePush);
            }
        }

        public TheNMIEditor(TheThing pThing)
        {
            if (pThing == null)
                MyBaseThing = new TheThing();
            else
                MyBaseThing = pThing;

            MyBaseThing.DeclareNMIProperty("ControlType", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("FormTitle", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Caption", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("TileLeft", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("TileTop", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("TileWidth", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("TileHeight", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("Flags", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("FldOrder", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("ClassName", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Style", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("IsAbsolute", ePropertyTypes.TBoolean);
            MyBaseThing.DeclareNMIProperty("IsVertical", ePropertyTypes.TBoolean);
            MyBaseThing.DeclareNMIProperty("IsInverted", ePropertyTypes.TBoolean);
            MyBaseThing.DeclareNMIProperty("MinValue", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("MaxValue", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("SeriesNames", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Title", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("NoTE", ePropertyTypes.TBoolean);
            MyBaseThing.DeclareNMIProperty("Units", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Format", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Options", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("MainBackground", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Background", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Foreground", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("ForegroundOpacity", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Opacity", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Disabled", ePropertyTypes.TBoolean);
            MyBaseThing.DeclareNMIProperty("Visibility", ePropertyTypes.TBoolean);
            MyBaseThing.DeclareNMIProperty("Speed", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("Delay", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("Throttle", ePropertyTypes.TNumber);
            MyBaseThing.DeclareNMIProperty("Group", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("NUITags", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("Label", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("LabelClassName", ePropertyTypes.TString);
            MyBaseThing.DeclareNMIProperty("LabelForeground", ePropertyTypes.TString);
            MyBaseThing.SetIThingObject(this);
        }


        public bool DontMonitor
        {
            get { return TheThing.GetSafePropertyBool(MyBaseThing, "DontMonitor"); }
            set
            {
                MyBaseThing.SetProperty("DontMonitor", value.ToString(), ePropertyTypes.TBoolean);
            }
        }
        public bool IsActive
        {
            get { return TheThing.GetSafePropertyBool(MyBaseThing, "IsActive"); }
            set
            {
                MyBaseThing.SetProperty("IsActive", value.ToString(), ePropertyTypes.TBoolean);
            }
        }

        public string LastMessage
        {
            get { return MyBaseThing.LastMessage; }
            set { MyBaseThing.LastMessage = value; }
        }
        public string ControlType
        {
            get { return TheThing.GetSafePropertyString(MyBaseThing, "ControlType"); }
            set { TheThing.SetSafePropertyString(MyBaseThing, "ControlType", value); }
        }
        public string FormTitle
        {
            get { return TheThing.GetSafePropertyString(MyBaseThing, "FormTitle"); }
            set { TheThing.SetSafePropertyString(MyBaseThing, "FormTitle", value); }
        }
        public int TileLeft
        {
            get { return TheCommonUtils.CInt(TheThing.GetSafePropertyNumber(MyBaseThing, "TileLeft")); }
            set { TheThing.SetSafePropertyNumber(MyBaseThing, "TileLeft", value); }
        }
        public int TileTop
        {
            get { return TheCommonUtils.CInt(TheThing.GetSafePropertyNumber(MyBaseThing, "TileTop")); }
            set { TheThing.SetSafePropertyNumber(MyBaseThing, "TileTop", value); }
        }
        public int TileWidth
        {
            get { return TheCommonUtils.CInt(TheThing.GetSafePropertyNumber(MyBaseThing, "TileWidth")); }
            set { TheThing.SetSafePropertyNumber(MyBaseThing, "TileWidth", value); }
        }
        public int TileHeight
        {
            get { return TheCommonUtils.CInt(TheThing.GetSafePropertyNumber(MyBaseThing, "TileHeight")); }
            set { TheThing.SetSafePropertyNumber(MyBaseThing, "TileHeight", value); }
        }
        public int Flags
        {
            get { return TheCommonUtils.CInt(TheThing.GetSafePropertyNumber(MyBaseThing, "Flags")); }
            set { TheThing.SetSafePropertyNumber(MyBaseThing, "Flags", value); }
        }
        public int FldOrder
        {
            get { return TheCommonUtils.CInt(TheThing.GetSafePropertyNumber(MyBaseThing, "FldOrder")); }
            set { TheThing.SetSafePropertyNumber(MyBaseThing, "FldOrder", value); }
        }
        public string ServerName
        {
            get { return TheThing.GetSafePropertyString(MyBaseThing, "ServerName"); }
            set { TheThing.SetSafePropertyString(MyBaseThing, "ServerName", value); }
        }
        public string ServerID
        {
            get { return TheThing.GetSafePropertyString(MyBaseThing, "ServerID"); }
            set { TheThing.SetSafePropertyString(MyBaseThing, "ServerID", value); }
        }
    }

}
