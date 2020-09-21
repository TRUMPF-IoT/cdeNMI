// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿
namespace cdeNMI {
    /////////////////////////////////////////////////////////////////////////
    /////***********************************************
    /////   C-DMyForms GENERATOR
    /////***********************************************
    /**
    * Creates a complete form for a given StorageMirror
    *
    * (4.1 Ready!)
    */
    export class ctrlIFrameView extends TheDataViewBase implements INMIDataView {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        MyScreenInfo: TheScreenInfo = null;
        MyFormInfo: TheFormInfo = null;
        MyTableName: string = null;
        mBaseDiv: HTMLDivElement = null;
        mDivDashboardContent: HTMLElement = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.FormView;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyTableName = cde.GuidToString(this.MyTRF.TableName);
            this.MyScreenInfo = cdeNMI.MyNMIModels[this.MyScreenID];
            if (this.MyTRF)
                this.MyTRF.ModelID = this.MyScreenID;

            const tDiv: HTMLDivElement = document.getElementById('Inline_' + cde.GuidToString(this.MyTableName)) as HTMLDivElement;
            if (tDiv)
                this.mBaseDiv = tDiv;

            if (!this.mBaseDiv && !pTargetControl && this.MyScreenInfo.MyStorageMeta[this.MyTableName]) {
                this.mBaseDiv = document.getElementById('Content_' + cde.GuidToString(this.MyScreenInfo.MyStorageMeta[this.MyTableName].TargetElement)) as HTMLDivElement;
            }
            const pClassName = 'CMyForm';
            if (!this.mBaseDiv) {
                this.mBaseDiv = document.createElement("div");
                this.mBaseDiv.className = pClassName;
                if (this.MyTarget) {
                    this.MyTarget.GetElement().innerHTML = "";    //OK
                }
            }
            else {
                this.mBaseDiv.innerHTML = "";    //OK
            }
            this.mBaseDiv.style.width = "inherit";
            this.mBaseDiv.style.height = (window.innerHeight-cdeNMI.GetSizeFromTile(1))+"px";
            this.mDivDashboardContent = document.createElement("iframe");
            this.mDivDashboardContent.className = "cdeDashboardIFrame";
            this.mDivDashboardContent.style.width = "inherit";
            this.mDivDashboardContent.style.height = "inherit";
            this.mDivDashboardContent.onload = (evt: Event) => {
                this.FireEvent(true, "OnIFrameLoaded", evt);
            };
            this.mDivDashboardContent.id = "cdeIFrame_" + this.MyScreenID;
            this.mBaseDiv.appendChild(this.mDivDashboardContent);

            this.SetElement(this.mBaseDiv, false, this.mDivDashboardContent);

            this.SetProperty("ID", "FORM_" + this.MyTableName);
            this.RegisterNMIControl();

            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "ClassName" && this.mDivDashboardContent) {
                this.mDivDashboardContent.className = pValue;
            } else 
                super.SetProperty(pName, pValue);
            if (pName === "Source") {
                if (this.GetProperty("AddHeader") && cde.MyCommChannel) {
                    cde.MyCommChannel.GetGlobalResource(pValue, this.GetProperty("AddHeader"), (t) => {
                        (this.MyContainerElement as HTMLIFrameElement).src = "data:text/html;charset=utf-8," + escape(t);
                    });
                    /*
    $.ajax({
        type: "GET",
        url: "https://app.icontact.com/icp/a/",
        contentType: "application/json",
        beforeSend: function(xhr, settings){
                xhr.setRequestHeader("some_custom_header", "foo");},
        success: function(data){
            $("#output_iframe_id").attr('src',"data:text/html;charset=utf-8," + escape(data))
        }
    });                 * */
                }
                else 
                    (this.MyContainerElement as HTMLIFrameElement).src = pValue;
            } else if (pName === "OnIFrameLoaded") {
                if (typeof pValue === "string" && (pValue as string).substr(0, 4) === "NOWN") {
                    const tP: string[] = (pValue as string).split(':');
                    this.RegisterEvent("OnIFrameLoaded", () => {
                        if (cdeNMI.MyEngine && this.MyTRF)
                            cdeNMI.MyEngine.GetBaseEngine().PublishToOwner(this.MyTRF.GetOwner(), "OnLoaded:" + this.MyTRF.GetMID() + (tP.length > 1 ? (":" + tP[1]) : ""), this.GetProperty("Source"), this.MyTRF.GetNodeID(), null, this.MyTRF.GetMID());
                    });
                } else
                    this.RegisterEvent("OnIFrameLoaded", pValue);
            } else if (pName === "Caption" || pName === "Title") {
                if (cdeNMI.MyScreenManager) {
                    const tS = cdeNMI.MyScreenManager.GetScreenByID(this.MyTableName);
                    if (tS)
                        tS.SetProperty(pName, pValue);
                }
            } else if (pName === "TileHeight") {
                if (!cde.CBool(this.GetSetting("HidePins")))
                    this.mDivDashboardContent.style.height = (this.GetElement().clientHeight - 44) + "px";    //44=39 +5
                else
                    this.mDivDashboardContent.style.height = "inherit";
            } else if (pName === "TileWidth") {
                this.ApplySkin();
            } else if (pName === "AllowScrolling") {
                this.mDivDashboardContent.style.overflow = "auto";
                this.ApplySkin();
            }
        }
    }
}