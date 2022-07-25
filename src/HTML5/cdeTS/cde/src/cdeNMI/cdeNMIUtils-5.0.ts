// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿interface String {
    format(...params: any[]): string;
    endsWith(string): boolean;
    startsWith(string): boolean;
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (suffix: string): boolean {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (suffix: string): boolean {
        return this.indexOf(suffix) !== -1;
    };
}

if (!String.prototype.format) {
    String.prototype.format = function (...params) {
        let formatted = this;
        for (let i = 0; i < params.length; i++) {
            const regexp = new RegExp('\\{' + i + '\\}', 'gi');
            formatted = formatted.replace(regexp, params[i]);
        }
        return formatted;
    };
}

namespace cdeNMI {
    declare const moment;    //Moment.JS dependency

    export function StopPointerEvents(evt: Event) {
        if (!evt) evt = window.event;
        if (!evt) return;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();
    }

    export function SetZIndex(pEle: HTMLElement, pIDX: number) {
        if (pEle) {
            pEle.style.position = "relative";
            pEle.style.zIndex = pIDX.toString();
        }
    }

    export function cdeEscapeHtml(source: string) {
        return String(source).replace(/[&<>"']/g, s => cdeNMI.TheEscapeMap[s]);
    }

    export function GetControlWidth(pControl: INMIControl): number {
        let tTileX = pControl.GetSetting("TileWidth");
        if (!tTileX)
            tTileX = 4;
        if (cde.CBool(pControl.GetSetting("NoTE")) === true)
            tTileX -= 2;
        if (tTileX < 0)
            tTileX = 1;
        return tTileX;
    }


    /// MultiTouch Check
    export function IsTouchDevice(): boolean {
        const el = document.createElement('div');
        el.setAttribute('ongesturestart', 'return;');
        if (typeof el.ontouchmove === "object") {
            return true;
        } else {
            return false;
        }
    }

    export function CleanState() {
        if (cde.MyBaseAssets.MyServiceHostInfo.PortalPage !== "")
            cdeNMI.ResetBrowserToPortal();
        else
            window.location.reload();
    }

    export function ResetKeyCorder() {
        cdeNMI.Key13Event = null;
        cdeNMI.Key27Event = null;
        cdeNMI.IsInEdit = false;
        cdeNMI.DisableKey36Event = false;
    }

    //////// Animations //////////////////////////////
    export function cdeBlendInTiles(subClass: string) {
        return;
    }


    export function RequestSync() {
        if (cde.MyContentEngine)
            cde.MyContentEngine.PublishToService('CDE_INIT_SYNC', '');
        if (cdeNMI.MyEngine)
            cdeNMI.MyEngine.FireEvent(true, "NMI_TOAST", 'Sync request sent to Relay');
    }

    export function ShowToastMessage(pTopic: string, pText?: string, pTime?: number) {
        if (cdeNMI.MyToast)
            cdeNMI.MyToast.ShowToastMessage(pTopic, pText, pTime);
    }


    function cdeDoRequestUpdate() {
        if (cde.MyContentEngine)
            cde.MyContentEngine.PublishToFirstNode('CDE_REQ_UPDATE', '');
        if (cdeNMI.MyPopUp)
            cdeNMI.MyPopUp.Show('Relay is restarting in several seconds. Click ok to logout', true, null, 1, cdeNMI.CleanState);
    }
    export function RequestUpdate() {
        if (cdeNMI.MyPopUp)
            cdeNMI.MyPopUp.Show('Are you sure you want to install this update? Your relay will restart and you need to login again.', false, null, 1, cdeDoRequestUpdate);
    }

    export function UpdateClock(pFactor = 1): string {
        if (pFactor < 1) pFactor = 1;
        return moment().format("[<span style='font-size:" + (32 / pFactor) + "px; font-weight: bold;'>]HH:mm[</span></BR><span style='font-size:" + (24 / pFactor) + "px'>]YYYY-MM-DD");
    }

    export function FormatDate(pDate: Date, pFormat: string): string {
        return moment(pDate).format(pFormat);
    }
    export function FormatDateNow(pFormat: string): string {
        return moment(Date.now()).format(pFormat);
    }
    export function StartClock(pControl: cdeNMI.INMIControl, pFactor = 1) {
        if (!pControl) return;

        setInterval(() => {
            pControl.SetProperty("iValue", UpdateClock(pFactor));
        }, 60000);

    }

    export function GetLocation(href: string): HTMLAnchorElement {
        const l: HTMLAnchorElement = document.createElement("a");
        l.href = href;
        return l;
    }

    export function RequestScopeID() {
        const tEdit: cdeNMI.INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.Password).Create(null, { TRF: new cdeNMI.TheTRF("SecID", 1, new cdeNMI.TheFieldInfo(cdeNMI.cdeControlType.SingleEnded, -1, "SecID:", 2, "SCOPEREQ")), PostInitBag: ["InnerClassName=cdeInput cdeInputCenter"] });
        if (cdeNMI.MyPopUp) {
            const tPopup: cdeNMI.INMIPopUp = cdeNMI.MyPopUp.Show('Are you sure you want to request a new Security ID?</br>All agents and nodes connected to this relay will have to update their corresponding IDs as well. If this is a secondary Relay, enter the ID of your primary relay here, otherwise leave this field blank',
                false, tEdit, 1, (obj: cdeNMI.INMIControl) => {
                    const pC: cdeNMI.INMIControl = obj.GetProperty("tEdit") as cdeNMI.INMIControl;
                    let tID = "";
                    if (pC) tID = pC.GetProperty("Value");
                    if (cde.MyContentEngine)
                        cde.MyContentEngine.PublishToFirstNode('CDE_REQ_SCOPEID', cde.MyContentEngine.RSAEncrypt(tID));
                });
            tPopup.SetProperty("tEdit", tEdit);
        }
    }

    export function TogglePortalFull(pShowFull: boolean) {
        const t: HTMLElement = document.getElementById('MyNMIPortal');
        if (t) {
            if (pShowFull)
                t.style.width = "100%";
            else
                t.style.width = null;
        }
    }

    ///Used by Convenience Apps
    export function NUITagAction(pTag: string, pCookie: string) {
        const tControl: cdeNMI.INMIControl = cdeNMI.MyNMINUITags[pTag];
        if (pTag === "go home") {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.GotoStationHome(false);
        }
        else if (pTag === "go back") {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.NavigateBack(false);
        }
        else if (tControl) {
            tControl.OnNUITag(pTag, pCookie);
        }
    }

    ///Used by Convenience Apps
    export function GetAllNUITags() {
        let tRes = "go home;go back";
        for (const i in cdeNMI.MyNMINUITags) {
            if (Object.prototype.hasOwnProperty.call(cdeNMI.MyNMINUITags,i)) {
                if (tRes.length > 0) tRes += ";";
                tRes += i;
            }
        }
        return tRes;
    }

    export function GetCurrentScreen() {
        if (cdeNMI.MyScreenManager) {
            return cdeNMI.MyScreenManager.GetCurrentScreen();
        }
        return "";
    }

    ///Used by Convenience Apps
    export function ApplyTheme() {
        let schemes;
        let i: number;
        let t;
        if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme) {
            schemes = document.getElementsByTagName("link");
            for (i = 0; i < schemes.length; i++) {
                if (!schemes[i].hasAttribute("lite"))
                    continue;
                t = schemes[i].attributes["lite"];
                if (t) {
                    const tN: string = cde.MyBaseAssets.MyCommStatus.InitialNPA;
                    schemes[i].setAttribute("href", t.nodeValue + (!tN ? "" : "?SID=" + tN.substr(4, tN.length - (4 + (tN.indexOf(".ashx") > 0 ? 5 : 0)))));
                }
            }
            if (cdeNMI.MyScreenManager) {
                cdeNMI.MyScreenManager.SwitchTheme(false);
            }
        }
        else {
            schemes = document.getElementsByTagName("link");
            for (i = 0; i < schemes.length; i++) {
                if (!schemes[i].hasAttribute("dark"))
                    continue;
                t = schemes[i].attributes["dark"];
                if (t) {
                    const tN: string = cde.MyBaseAssets.MyCommStatus.InitialNPA;
                    schemes[i].setAttribute("href", t.nodeValue + (!tN ? "" : "?SID=" + tN.substr(4, tN.length - (4 + (tN.indexOf(".ashx") > 0 ? 5 : 0)))));
                }
            }
            if (cdeNMI.MyScreenManager) {
                cdeNMI.MyScreenManager.SwitchTheme(true);
            }
        }
        cde.MyBaseAssets.FireEvent(true, "ThemeSwitched", cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme);
    }

    export function ToggleTheme() {
        cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme = !cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme;
        ApplyTheme();
    }

    export function AddCSSB4Header(pCSSFile: string, pCSSFileLite?: string) {
        let tFileCSS = cde.FixupPath(pCSSFile).toLowerCase();
        if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme && pCSSFileLite)
            tFileCSS = cde.FixupPath(pCSSFileLite).toLowerCase();
        const links = document.getElementsByTagName("link");
        if (links.length > 0) {
            for (let i = 0; i < links.length; i++) {
                if (links[i].getAttribute("href").toLowerCase() === tFileCSS)
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
        const tHead = document.getElementsByTagName("head")[0];
        tHead.insertBefore(fileref, tHead.childNodes[0]);
    }



    export function InsertCSS(pCSSName: string) {
        const headID = document.getElementsByTagName("head")[0];
        const cssNode: HTMLLinkElement = document.createElement('link');
        cssNode.type = 'text/css';
        cssNode.rel = 'stylesheet';
        cssNode.href = pCSSName + '.css';
        cssNode.media = 'screen';
        headID.appendChild(cssNode);
    }

    export function ThingLookup(tDefaults: string): string {
        let retStr: string = cdeNMI.TheFlashCache.GetCache(tDefaults);
        if (retStr) return retStr;
        retStr = "";
        const MyTableName: string = cde.GuidToString('B510837F-3B75-4CF2-A900-D36C19113A13');
        const tParas: string[] = tDefaults.split(':');
        if (tParas.length > 2) {
            const tMyScreenInfo: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[cde.GuidToString('FAFA22FF-96AC-42CF-B1DB-7C073053FC39')]; //Possible has to come from Paras
            if (!tMyScreenInfo || !tMyScreenInfo.MyStorageMirror[MyTableName]) return "";
            for (let row = 0; row < tMyScreenInfo.MyStorageMirror[MyTableName].length; row++) {
                const tRow = tMyScreenInfo.MyStorageMirror[MyTableName][row];
                const tSearch: string = cdeNMI.GetFldContentByName(tRow, "MyPropertyBag." + tParas[0] + ".Value", false);
                if (!tSearch || tSearch.length === 0) continue;
                if (cde.GuidToString(tSearch) !== cde.GuidToString(tParas[1])) continue;
                const tName: string = cdeNMI.GetFldContentByName(tRow, "MyPropertyBag." + tParas[2] + ".Value", false);
                if (tName && tName !== "")
                    retStr = tName;
                cdeNMI.TheFlashCache.AddCache(tDefaults, retStr, 3000);
            }
        }
        return retStr;
    }

    export function cdeParseHTML(pTargetControl: cdeNMI.INMIControl, pTRF: cdeNMI.TheTRF, pHTML: string) {
        if (pTargetControl === null) return;
        if (pTargetControl.HasFacePlate === true)
            return;
        pTargetControl.HasFacePlate = true;
        if (cdeNMI.MyEngine && pTRF && pTRF.ModelID && pTRF.TableName) {
            const tWait: cdeNMI.TheFaceWait = new cdeNMI.TheFaceWait();
            tWait.TRF = pTRF;
            tWait.TargetControl = pTargetControl;
            tWait.HTML = pHTML;
            cdeNMI.MyEngine.LoadTableLazy(pTRF.ModelID, pTRF.TableName, cdeNMI.DoParseHTML, tWait);
        } else {
            pTargetControl.GetContainerElement().innerHTML = pHTML;
        }
    }
    export function GetStringSegment(pInStr: string, pStart: string, pEnd: string): string {
        if (!pInStr || !pStart || !pEnd) return null;
        const pos: number = pInStr.indexOf(pStart);
        if (pos < 0) return null;
        const posEnd: number = pInStr.indexOf(pEnd, pos + pStart.length);
        if (posEnd < 0) return null;
        const Outer = pInStr.substr(pos, (posEnd - pos) + pEnd.length);
        if (Outer.length < pStart.length + pEnd.length + 1)
            return null;
        return Outer.substr(pStart.length, Outer.length - (pStart.length + pEnd.length));
    }

    export function ReturnStringSegment(pHTML: string, pStart: string, pEnd: string): cde.TheSegment {
        if (!pHTML || !pStart || !pEnd) return null;
        const tSeg: cde.TheSegment = new cde.TheSegment();
        const pos: number = pHTML.indexOf(pStart);
        if (pos < 0) return null;
        const posEnd: number = pHTML.indexOf(pEnd, pos + pStart.length);
        if (posEnd < 0) return null;
        tSeg.Outer = pHTML.substr(pos, (posEnd - pos) + pEnd.length);
        if (tSeg.Outer.length < pStart.length + pEnd.length + 1)
            return null;
        tSeg.Inner = tSeg.Outer.substr(pStart.length, tSeg.Outer.length - (pStart.length + pEnd.length));
        return tSeg;
    }

    export function CreateTCB(pTRF: cdeNMI.TheTRF, pName: string, pType: cdeNMI.cdeControlType = cdeNMI.cdeControlType.SingleEnded): cdeNMI.TheControlBlock {
        const tTCB: cdeNMI.TheControlBlock = new cdeNMI.TheControlBlock();
        tTCB.TargetID = "CNMIC" + (cdeNMI.MyNMISettings.IDCounter++);
        tTCB.MyControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel); 

        let tFldContent = "";
        const tFldInfo: cdeNMI.TheFieldInfo = new cdeNMI.TheFieldInfo(cdeControlType.SmartLabel, 0, null);
        tFldInfo.DataItem = "MyPropertyBag." + pName + ".Value";
        if (pTRF && pTRF.FldInfo) {
            tFldInfo.cdeO = pTRF.FldInfo.cdeO;
            tFldInfo.FormID = cde.GuidToString(pTRF.TableName);
            tFldInfo.cdeN = pTRF.FldInfo.cdeN;
            tFldInfo.Type = pType;
            tFldInfo["Element"] = "span";

            const tMyScreenInfo = cdeNMI.MyNMIModels[pTRF.ModelID];
            if (tMyScreenInfo && tMyScreenInfo.MyStorageMirror[pTRF.TableName]) {
                tFldContent = cdeNMI.GetFldContent(tMyScreenInfo.MyStorageMirror[pTRF.TableName][pTRF.RowNo], tFldInfo, false, false);
            }
        }
        const tTRF: cdeNMI.TheTRF = new cdeNMI.TheTRF(pTRF ? pTRF.TableName : "", pTRF ? pTRF.RowNo : 0, tFldInfo);
        tTRF.ModelID = pTRF ? pTRF.ModelID : null;
        tTCB.MyControl.InitControl(null, tTRF);
        tTCB.MyControl.SetProperty("iValue", tFldContent);

        if (!cdeNMI.MyTCBs[tTRF.TableName + "_" + pTRF.RowNo])
            cdeNMI.MyTCBs[tTRF.TableName + "_" + pTRF.RowNo] = [];
        cdeNMI.MyTCBs[tTRF.TableName + "_" + pTRF.RowNo].push(tTCB);
        cdeNMI.ThePB.SetRawProperty(tTCB.MyControl, "OnThingEvent", tTRF.TableName + ";" + pName);

        cdeNMI.MyEngine.RegisterEvent("RecordUpdated_" + tTRF.TableName + "_" + pTRF.RowNo, (pSI: cdeNMI.INMIControl, pModelGUID: string, tTabName: string, tRowID: number, pDirtyMask: string) => {
            if (pModelGUID && pModelGUID !== "") {
                const tMod: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[pModelGUID];
                for (const tIdx in cdeNMI.MyTCBs[tTRF.TableName + "_" + pTRF.RowNo]) {
                    const tTCB2 = cdeNMI.MyTCBs[tTRF.TableName + "_" + pTRF.RowNo][tIdx] as cdeNMI.TheControlBlock;
                    if (tTCB2) {
                        if (!tMod.MyStorageMirror[tTabName][tRowID].hasOwnProperty('SecToken')) {
                            const tCont = cdeNMI.GetFldContent(tMod.MyStorageMirror[tTabName][tRowID], tTCB2.MyControl.MyFieldInfo, false, false);
                            if (tTCB2.MyControl.GetProperty("Value") !== tCont)
                                tTCB2.MyControl.SetProperty("iValue", tCont);
                        }
                    }
                }
            }
        });
        return tTCB;
    }


    export function DoParseHTML(pTable, pFacePlate: cdeNMI.TheFaceWait) {
        if (!pTable) return;
        let tSeg: cde.TheSegment;
        let tTCB: cdeNMI.TheControlBlock;
        while (true) {
            tSeg = cdeNMI.ReturnStringSegment(pFacePlate.HTML, "<%P:", "%>");
            if (tSeg === null) break;
            tTCB = new cdeNMI.TheControlBlock();
            tTCB.TargetID = "CNMIC" + (cdeNMI.MyNMISettings.IDCounter++);
            pFacePlate.TargetControl.SetProperty(tSeg.Inner + "_TCB", tTCB);
            pFacePlate.HTML = pFacePlate.HTML.replace(tSeg.Outer, "<span ID=" + tTCB.TargetID + "></span>");
        }
        while (true) {
            tSeg = cdeNMI.ReturnStringSegment(pFacePlate.HTML, "<%C21:", "%>");
            if (tSeg === null) break;
            tTCB = CreateTCB(pFacePlate.TRF, tSeg.Inner, cdeNMI.cdeControlType.DateTime);
            pFacePlate.TargetControl.MySubControls.push(tTCB);
            pFacePlate.HTML = pFacePlate.HTML.replace(tSeg.Outer, "<span ID=" + tTCB.TargetID + "></span>");
        }
        while (true) {
            tSeg = cdeNMI.ReturnStringSegment(pFacePlate.HTML, "<%C20:", "%>");
            if (tSeg === null) break;
            tTCB = CreateTCB(pFacePlate.TRF, tSeg.Inner);
            pFacePlate.TargetControl.MySubControls.push(tTCB);
            pFacePlate.HTML = pFacePlate.HTML.replace(tSeg.Outer, "<span ID=" + tTCB.TargetID + "></span>");
        }
        while (true) {
            tSeg = cdeNMI.ReturnStringSegment(pFacePlate.HTML, "<%I:", "%>");
            if (tSeg === null) break;
            tTCB = CreateTCB(pFacePlate.TRF, tSeg.Inner);
            pFacePlate.TargetControl.MySubControls.push(tTCB);
            pFacePlate.HTML = pFacePlate.HTML.replace(tSeg.Outer, tTCB.MyControl.GetProperty("Value") + '" ID="' + tTCB.TargetID + '_TGT');
            tTCB.MyControl.SetProperty("Visibility", false);
            tTCB.MyControl.SetProperty("MyTCB", tTCB);
            tTCB.OnIValueChanged = (sender: INMIControl, pEvt, pVal) => {
                const ttcb: TheControlBlock = sender.GetProperty("MyTCB");
                if (pVal && document.getElementById(ttcb.TargetID + "_TGT"))
                    (document.getElementById(ttcb.TargetID + "_TGT") as HTMLImageElement).src = cde.FixupPath(pVal);
            };
            pFacePlate.HTML += "<span ID=" + tTCB.TargetID + "></span>";
        }
        while (true) {
            tSeg = cdeNMI.ReturnStringSegment(pFacePlate.HTML, "<%V:", "%>");
            if (tSeg === null) break;
            tTCB = CreateTCB(pFacePlate.TRF, tSeg.Inner);
            pFacePlate.TargetControl.MySubControls.push(tTCB);
            pFacePlate.HTML = pFacePlate.HTML.replace(tSeg.Outer, tTCB.MyControl.GetProperty("Value") + '" ID="' + tTCB.TargetID + '_TGT');
            tTCB.MyControl.SetProperty("Visibility", false);
            tTCB.MyControl.SetProperty("MyTCB", tTCB);
            tTCB.OnIValueChanged = (sender: INMIControl, pEvt, pVal) => {
                const ttcb: TheControlBlock = sender.GetProperty("MyTCB");
                if (pVal && document.getElementById(ttcb.TargetID + "_TGT"))
                    (document.getElementById(ttcb.TargetID + "_TGT") as HTMLInputElement).value = pVal;
            };
            pFacePlate.HTML += "<span ID=" + tTCB.TargetID + "></span>";
        }
        while (true) {
            tSeg = cdeNMI.ReturnStringSegment(pFacePlate.HTML, 'cdeTAG="<%S:', "%>");
            if (tSeg === null) break;
            tTCB = CreateTCB(pFacePlate.TRF, tSeg.Inner);
            pFacePlate.TargetControl.MySubControls.push(tTCB);
            pFacePlate.HTML = pFacePlate.HTML.replace(tSeg.Outer, "style='" + tTCB.MyControl.GetProperty("Value") + ";' ID='" + tTCB.TargetID + "_TGT'");
            tTCB.MyControl.SetProperty("Visibility", false);
            tTCB.MyControl.SetProperty("MyTCB", tTCB);
            tTCB.OnIValueChanged = (sender: INMIControl, pEvt, pVal) => {
                const ttcb: TheControlBlock = sender.GetProperty("MyTCB");
                if (pVal && document.getElementById(ttcb.TargetID + "_TGT"))
                    document.getElementById(ttcb.TargetID + "_TGT").style.cssText = pVal;
            };
            pFacePlate.HTML += "<span ID=" + tTCB.TargetID + "></span>";
        }
        pFacePlate.HTML = cdeNMI.GenerateFinalString(pFacePlate.HTML, false, pFacePlate.TRF);
        pFacePlate.TargetControl.GetContainerElement().innerHTML = pFacePlate.HTML;
        for (let i = 0; i < pFacePlate.TargetControl.MySubControls.length; i++) {
            const tELE: HTMLElement = document.getElementById(pFacePlate.TargetControl.MySubControls[i].TargetID);
            if (tELE) {
                const tP: HTMLElement = tELE.parentElement;
                tP.replaceChild(pFacePlate.TargetControl.MySubControls[i].MyControl.GetElement(), tELE);
                if (pFacePlate.TargetControl.MySubControls[i].OnIValueChanged)
                    pFacePlate.TargetControl.MySubControls[i].MyControl.SetProperty("OniValueChanged", pFacePlate.TargetControl.MySubControls[i].OnIValueChanged);
            }
        }
    }

    export function GenerateFinalString(pInStr, pData?, pTRF?: cdeNMI.TheTRF, pKeepMacro?: boolean): string {
        if (!pInStr) return pInStr;
        if (typeof pInStr !== "string") pInStr = pInStr.toString();
        let outStr: string = pInStr;
        if (outStr.indexOf('<%UN%>') >= 0) {
            if (cde.MyBaseAssets.MyCommStatus.UserPref && cde.MyBaseAssets.MyCommStatus.UserPref.CurrentUserName)
                outStr = outStr.replace('<%UN%>', cde.MyBaseAssets.MyCommStatus.UserPref.CurrentUserName);
            else
                outStr = outStr.replace('<%UN%>', '');
        }
        if (outStr.indexOf('<%NOW%>') >= 0) {
            outStr = outStr.replace('<%NOW%>', moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"));
        }
        if (pTRF && !pData) {
            const tScreenInfo: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[pTRF.ModelID];
            if (tScreenInfo && tScreenInfo.MyStorageMirror && tScreenInfo.MyStorageMirror[pTRF.TableName])
                pData = tScreenInfo.MyStorageMirror[pTRF.TableName][pTRF.RowNo];
        }

        if (pData && pData !== true) {
            if (outStr.indexOf('<%NN%>') >= 0) {
                try {
                    outStr = outStr.replace('<%NN%>', pData.cdeN && cdeNMI.MyEngine ? cdeNMI.MyEngine.GetKnownNodeName(pData.cdeN) : '');
                }
                catch
                {
                    outStr = outStr.replace('<%NN%>', '');
                }
            }
            for (const index in pData) {
                if (Object.prototype.hasOwnProperty.call(pData, index)) {
                    if (index === "MyPropertyBag" && outStr.indexOf('%') >= 0) {
                        const myPropertyBag = pData["MyPropertyBag"];
                        for (const tBagItem in myPropertyBag) {
                            if (Object.prototype.hasOwnProperty.call(myPropertyBag, tBagItem)) {
                                if (outStr.indexOf('%MyPropertyBag.' + tBagItem + '.Value%') >= 0) {
                                    outStr = outStr.replace('%MyPropertyBag.' + tBagItem + '.Value%',
                                        myPropertyBag[tBagItem]["Value"]);
                                } else if (outStr.indexOf('<%' + tBagItem + '%>') >= 0) {
                                    outStr = outStr.replace('<%' + tBagItem + '%>',
                                        myPropertyBag[tBagItem]["Value"]);
                                } else if (outStr.indexOf('%' + tBagItem + '%') >= 0 && myPropertyBag[tBagItem]["Value"]) {
                                    outStr = outStr
                                        .replace('%' + tBagItem + '%', myPropertyBag[tBagItem]["Value"]);
                                }
                            }
                        }
                    }
                    let repl: string;
                    let tInStr: string;
                    if (outStr.indexOf('<%' + index + '%>') >= 0) {
                        repl = "";
                        if (pData[index]) {
                            if (typeof pData[index] !== "string") repl = pData[index].toString();
                            else repl = pData[index];
                        }
                        tInStr = "";
                        do {
                            tInStr = outStr;
                            outStr = outStr.replace('<%' + index + '%>', GenerateFinalString(repl, pData, pTRF));
                        } while (tInStr !== outStr);
                    } else if (pData[index] &&
                        pData[index].MyFieldInfo &&
                        pData[index].MyFieldInfo.FldOrder &&
                        outStr.indexOf('<%' + pData[index].MyFieldInfo.FldOrder + ".") >= 0) {
                        const tFldO = pData[index].MyFieldInfo.FldOrder.toString();
                        const tPos: number = outStr.indexOf('<%' + tFldO + ".") + tFldO.length + 3;
                        const tPosEnd: number = outStr.indexOf("%>", tPos);
                        const tPropName: string = outStr.substring(tPos, tPosEnd);
                        const tVal = pData[index].GetProperty(tPropName);
                        if (tVal) {
                            outStr = tVal.toString();
                        }
                    } else if (outStr.indexOf('%' + index + '%') >= 0) {
                        repl = "";
                        if (pData[index]) {
                            if (typeof pData[index] !== "string") repl = pData[index].toString();
                            else repl = pData[index];
                        }
                        tInStr = "";
                        do {
                            tInStr = outStr;
                            outStr = outStr.replace('%' + index + '%', GenerateFinalString(repl, pData, pTRF));
                        } while (tInStr !== outStr);
                    }
                }
            }
        }

        if (pTRF && pTRF.FldInfo) {
            let tT = 1;
            let gfsoutStr: string;

            while (tT === 1) {
                gfsoutStr = outStr;
                if (gfsoutStr.indexOf("%") < 0) break;		// 3 Recursions allowed then out...

                const tFound: cde.TheSegment = cdeNMI.ReturnStringSegment(gfsoutStr, "%", "%");
                if (tFound) {
                    const tFl: string = pTRF.FldInfo[tFound.Inner];
                    if (tFl)
                        gfsoutStr = gfsoutStr.replace(tFound.Outer, tFl);
                }
                if (gfsoutStr !== outStr) outStr = gfsoutStr; else tT = 0;
            }
        }

        if (!pKeepMacro) {
            while (outStr.indexOf("<%") >= 0) {
                if (outStr.indexOf("%>") > 0) {
                    const tPre: string = outStr.substr(0, outStr.indexOf("<%"));
                    outStr = tPre + outStr.substr(outStr.indexOf("%>") + 2);
                }
                else
                    break;
            }
        }
        return outStr;
    }

    export function IconFAShim(pInstr: string): string {
        if (pInstr.indexOf("&#x") < 0)
            return pInstr;
        let tOut: string = pInstr.replace("&#xf20e;", "&#xf61f;");
        tOut = tOut.replace("&#xf05D;", "&#xf058;");
        tOut = tOut.replace("&#xf0f6;", "&#xf46d;");
        return tOut;
    }

    export function IconShim(pInstr: string): string {
        if (pInstr.indexOf("<$Loading$>") >= 0)
            pInstr = pInstr.replace("<$Loading$>", "Loading... <i class='fa fa-spinner fa-pulse'></i>");

        if (pInstr.indexOf("<$IsIso$>") >= 0)
            pInstr = pInstr.replace("<$IsIso$>", "<i class='fa fa-3x' style='color:green'>&#xf045;</i>");
        if (pInstr.indexOf("<$IsoNot$>") >= 0)
            pInstr = pInstr.replace("<$IsoNot$>", "<i class='fa fa-3x'>&#xf096;</i>");

        if (pInstr.indexOf("<$IsEnabled$>") >= 0)
            pInstr = pInstr.replace("<$IsEnabled$>", "<i class='fa fa-3x' style='color:green'>&#xf05D;</i>");
        if (pInstr.indexOf("<$IsDisabled$>") >= 0)
            pInstr = pInstr.replace("<$IsDisabled$>", "<i class='fa fa-3x' style='color:red'>&#xf05E;</i>");

        if (pInstr.indexOf("<$IsUnloaded>") >= 0)
            pInstr = pInstr.replace("<$IsUnloaded>", "<i class='fa fa-4x' style='color:green'>&#xf04B;</i>");
        if (pInstr.indexOf("<$IsLoaded$>") >= 0)
            pInstr = pInstr.replace("<$IsLoaded$>", "<i class='fa fa-4x' style='color:red'>&#xf04D;</i>");

        if (pInstr.indexOf("<$NoBreak$>") >= 0)
            pInstr = pInstr.replace("<$NoBreak$>", "&nbsp;");
        return pInstr;
    }

    export function AddFieldComment(pTarget: HTMLElement, pFieldInfo: TheFieldInfo): HTMLElement {
        if (!pFieldInfo) return null;
        const tHelpText: string = pFieldInfo["HelpText"];
        let dHelp: HTMLDivElement = null;
        if (tHelpText && tHelpText !== "") {
            dHelp = document.createElement("div");
            dHelp.className = "cdeFormEntryComment";
            dHelp.innerHTML = tHelpText;
            pTarget.appendChild(dHelp);
        }
        return dHelp;
    }

    export function UpdFldContent(pRowData, pFormField: cdeNMI.TheFieldInfo, pNewValue: string, pOldValues: []): boolean {
        if (!pRowData || !pFormField || !pFormField.DataItem) return false;
        const tDataItem: string[] = pFormField.DataItem.split('.');
        let tFldName = tDataItem[1];
        if (tDataItem.length > 3) {
            for (let i = 2; i < tDataItem.length - 1; i++) {
                tFldName += "." + tDataItem[i];
            }
        }
        let tFldContent: string = pRowData[tDataItem[0]];
        let tHasNewValue = false;
        if (tDataItem.length > 1) {
            for (let u = 1; u < tDataItem.length - 1; u++) {
                if (tFldContent === undefined) {
                    break;
                }
                else {
                    tFldContent = tFldContent[tDataItem[u]];
                }
            }
            if (!tFldContent) {
                if (tDataItem[0] === "MyPropertyBag" && !cde.IsNotSet(pNewValue)) {
                    if (!pRowData[tDataItem[0]])
                        pRowData[tDataItem[0]] = {};
                    pRowData[tDataItem[0]][tFldName] = new cde.cdeP();
                    pRowData[tDataItem[0]][tFldName].Name = tFldName;
                    pRowData[tDataItem[0]][tFldName].Value = pNewValue;
                    tHasNewValue = true;
                }
            }
            else {
                if ((pFormField && cde.CBool(pFormField["ForceSet"])) || (tFldContent[tDataItem[tDataItem.length - 1]] !== pNewValue && (!pOldValues || pOldValues[tDataItem[tDataItem.length - 1]] !== pNewValue))) {
                    if (pOldValues && !pOldValues[tDataItem[tDataItem.length - 1]])
                        pOldValues[tDataItem[tDataItem.length - 1]] = tFldContent[tDataItem[tDataItem.length - 1]];
                    //testing for encrypt with ((pFormField.Flags & 1) != 0 && cde.MyContentEngine) 
                     //  then encrypt with RSA tFldContent[tDataItem[tDataItem.length - 1]] = "&^CDEP5^&:" + cde.MyContentEngine.RSAEncrypt(pNewValue); //coming soon...RSA does fail at the moment else
                    tFldContent[tDataItem[tDataItem.length - 1]] = pNewValue; //NOSONAR this is correct for now
                    tHasNewValue = true;
                }
            }
        }
        else {
            if (pRowData.hasOwnProperty('SecToken') || (tFldContent !== pNewValue && (!pOldValues || pOldValues[tDataItem[0]] !== pNewValue))) {
                if (pOldValues && !pOldValues[tDataItem[0]])
                    pOldValues[tDataItem[0]] = tFldContent;
                if (pRowData.hasOwnProperty('SecToken') && (pFormField.Flags & 1) !== 0) {
                    if (pRowData.SecToken === "")
                        pRowData.SecToken = "CDE!";
                    pRowData.SecToken += ";:;" + pFormField.FldOrder + "=" + pNewValue;
                    pRowData[tDataItem[0]] = null;
                }
                else {
                    pRowData[tDataItem[0]] = pNewValue;
                }
                tHasNewValue = true;
            }
        }
        return tHasNewValue;
    }

    export function SortArrayByProperty<T>(pInArray: Array<T>, property: string, IsNumeric: boolean, pSortDescending: boolean): Array<T> {
        if (!pInArray) return [];
        const tArray = pInArray.slice(0);
        return tArray.sort((a, b) => {
            let c;
            let d;
            if (property.indexOf('.') > 0) {
                c = cdeNMI.GetFldContentByName(a, property, false);
                d = cdeNMI.GetFldContentByName(b, property, false);
            }
            else {
                c = IsNumeric ? parseFloat(a[property]) : a[property].toString();
                d = IsNumeric ? parseFloat(b[property]) : b[property].toString();
            }
            if (c === d) return 0;
            return pSortDescending ? d > c ? 1 : -1 : d < c ? 1 : -1;
        });
    }

    export function GetFldContent(pTableRow, pFormField: cdeNMI.TheFieldInfo, pIsGenerated: boolean, pIsDeepRow: boolean): string {
        if (!pFormField || !pFormField.DataItem || !pFormField.DataItem || !pTableRow) return null;
        const tFldName: string[] = pFormField.DataItem.split('.');
        let tFldContent: string;
        if (pIsDeepRow && tFldName.length > 1) {
            let tFldRealName = tFldName[1]; 
            if (tFldName.length > 3) {
                for (let i = 2; i < tFldName.length - 1; i++) {
                    tFldRealName += "." + tFldName[i];
                }
            }
            tFldContent = pTableRow[tFldRealName];
        }
        else {
            if (tFldName[0] === "cdeN") {
                if (cdeNMI.MyEngine && !cdeNMI.MyEngine.IsNodeDown(pTableRow.cdeN)) {
                    tFldContent = cdeNMI.MyEngine.GetKnownNodeName(pTableRow.cdeN);
                }
                if (!tFldContent)
                    tFldContent = pTableRow.cdeN;
                return tFldContent;
            }
            else
                tFldContent = pTableRow[tFldName[0]];
            if (tFldName.length > 1) {
                for (let u = 1; u < tFldName.length; u++) {
                    if (tFldContent === undefined) {
                        tFldContent = "";
                        break;
                    }
                    else {
                        tFldContent = tFldContent[tFldName[u]];
                        if (pIsGenerated && tFldContent !== undefined && tFldContent.length > 5 && tFldContent.substring(0, 5) === "/Date") {
                            pFormField.Type = 21;
                            pFormField["FldWidth"] = 5;
                        }
                    }
                }
            }
        }
        return tFldContent;
    }
    export function GetFldContentByName(pTableRow, pFormField: string, pIsDeepRow: boolean): string {
        if (!pFormField) return null;
        let tFldContent: string = null;
        try {
            const tFldName: string[] = pFormField.split('.');
            if (pIsDeepRow) {
                let tFldRealName = tFldName[1]; 
                if (tFldName.length > 3) {
                    for (let i = 2; i < tFldName.length - 1; i++) {
                        tFldRealName += "." + tFldName[i];
                    }
                }
                tFldContent = pTableRow[tFldRealName];
            }
            else {
                tFldContent = pTableRow[tFldName[0]];
                if (tFldName.length > 1) {
                    for (let u = 1; u < tFldName.length; u++) {
                        if (tFldContent === undefined) {
                            tFldContent = "";
                            break;
                        }
                        else {
                            tFldContent = tFldContent[tFldName[u]];
                        }
                    }
                }
            }
        }
        catch (ee) {
            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "nmiUtils:GetFldContentByName:error", ee);
        }
        return tFldContent;
    }

    export function RemoveCookies() {
        const res = document.cookie;
        const multiple = res.split(";");
        for (let i = 0; i < multiple.length; i++) {
            const key = multiple[i].split("=");
            document.cookie = key[0] + " =; expires = Thu, 01 Jan 1970 00:00:00 UTC";
        }
    }

    export class TheMaterialTouch {

        options_default = {
            classes: {
                rippleContainer: 'md-ripple-wrapper',
                ripple: 'md-ripple-effect'
            },
            transition: {
                delay: 0,
                duration: 300
            },
            opacity: 0.3,
            size: 100,
            center: false
        };
        options = null;
        data = { transition: false };
        mItem: HTMLElement = null;

        constructor(customOptions?) {
            const optionsDefault = this.options_default;
            this.options = (customOptions ? this.MergeObject(optionsDefault, customOptions) : optionsDefault);
        }

        MergeObject(...params: any[]): any {
            const
                self = this,
                arraynew = {};

            for (let ai in arguments) {
                if (arguments.hasOwnProperty(ai)) {
                    const array = arguments[ai];
                    for (let index in array) {
                        if (array.hasOwnProperty(index)) {
                            let value;
                            if (array.hasOwnProperty(index)) {
                                if (typeof array[index] === 'object' && arraynew[index] && typeof arraynew[index] === 'object'
                                ) value = self.MergeObject(arraynew[index], array[index]);
                                else value = array[index];

                                arraynew[index] = value;
                            }
                        }
                    }
                }
            }
            return arraynew;
        }

        ShowWave(item: HTMLElement, e) {
            this.mItem = item;
            const clickX = e.x;
            const clickY = e.y;
            const width = item.offsetWidth;
            const height = item.offsetHeight;
            const size = this.options.size;

            let rippleWrapper = null;

            if (item.querySelector !== undefined)
                rippleWrapper = item.querySelector('.' + this.options.classes.rippleContainer);


            if (!rippleWrapper) {
                rippleWrapper = document.createElement('div');
                rippleWrapper.setAttribute('class', this.options.classes.rippleContainer);
                item.appendChild(rippleWrapper);
            }

            const ripple = document.createElement('div');
            ripple.setAttribute('class', this.options.classes.ripple);

            ripple.style.opacity = this.options.opacity;

            ripple.style.top = clickY + 'px';
            ripple.style.left = clickX + 'px';
            ripple.style.width = "0";
            ripple.style.height = "0";

            rippleWrapper.appendChild(ripple);

            let newX = (clickX - (size / 2)),
                newY = (clickY - (size / 2));

            if (this.options.center) {
                newX = (width / 2) - (size / 2);
                newY = (height / 2) - (size / 2);
            }

            this.DoRender(ripple, {
                top: newY + 'px',
                left: newX + 'px',
                width: size + 'px',
                height: size + 'px'
            });

            setTimeout(() => {
                this.EndWave(this.mItem);
            }, 100);
        }

        EndWave(item: HTMLElement) {
            const rippleWrapper = item.querySelector('.' + this.options.classes.rippleContainer);
            let ripples;

            if (rippleWrapper && rippleWrapper.children) {
                ripples = rippleWrapper.children;
                [].forEach.call(ripples, (ripple) => {

                    this.DoRender(ripple, { opacity: 0 });

                    setTimeout(() => {
                        if (ripple.parentElement) ripple.parentElement.removeChild(ripple);
                    }, this.options.transition.duration);
                });
            }
        }

        EasyMeOut(pTime, pVal1, pVal2, pDura) {
            return pVal2 * (-Math.pow(2, -10 * pTime / pDura) + 1) + pVal1;
        }

        DoRender(obj: HTMLElement, properties, duration?: number) {
            const propertiesObject = {};
            const timeStart = new Date().getTime();

            if (!duration && duration !== 0) duration = this.options.transition.duration;

            for (const prop in properties) {
                if (properties.hasOwnProperty(prop)) {
                    propertiesObject[prop] = obj.style[prop];
                }
            }

            this.data.transition = true;

            const animate = setInterval(() => {
                let timePassed = new Date().getTime() - timeStart;
                if (timePassed >= duration) timePassed = duration;

                // Run property update per property
                let propValue;
                let prop;
                for (prop in properties) {
                    if (properties.hasOwnProperty(prop)) {
                        propValue = properties[prop];
                        let
                            defaultValue = propertiesObject[prop],
                            newValue = null,
                            defaultSuffix = null,
                            negative = 0;

                        if (typeof defaultValue === 'string') defaultSuffix = defaultValue.replace(/^\-?[0-9\.]+(.*)$/, '$1'); //NOSONAR Not Critical
                        defaultValue = parseFloat(defaultValue);
                        propValue = parseFloat(propValue);

                            negative = (propValue < defaultValue ? propValue : defaultValue);

                            defaultValue = defaultValue - negative;
                            propValue = propValue - negative;

                        if (defaultValue > propValue) {
                            newValue = defaultValue - this.EasyMeOut(timePassed, propValue, defaultValue, duration);

                            if (newValue < propValue) newValue = propValue;
                        } else if (defaultValue !== propValue) {
                            newValue = this.EasyMeOut(timePassed, defaultValue, propValue, duration);

                            if (newValue > propValue) newValue = propValue;
                        } else {
                            newValue = propValue;
                        }

                        // Remember "negative"? Add it back
                        if (negative !== 0) newValue = newValue + negative;

                        newValue = newValue + '';
                        newValue = newValue.replace(/(\d+(\.\d{0,3})?).*/, "$1");
                        newValue = parseFloat(newValue);

                        if (defaultSuffix) {
                            newValue = newValue + defaultSuffix;
                        }

                        obj.style[prop] = newValue;
                    }
                }

                if (timePassed >= duration) {
                    clearInterval(animate);

                    // Make sure all properties are set to the correct final value
                    for (prop in properties) {
                        if (properties.hasOwnProperty(prop)) {
                            propValue = properties[prop];
                            let propSuffix = null;

                            if (typeof propValue === 'string') propSuffix = propValue.replace(/^\-?[0-9\.]+(.*)$/, '$1'); //NOSONAR Not Critical

                            propValue = parseFloat(propValue);

                            obj.style[prop] = (propSuffix ? propValue + propSuffix : propValue);

                            // Set transition to false
                            this.data.transition = false;
                        }
                    }
                }
            }, 24);
        }
    }

    export function cdeJsonDate2JSDate(jsonDate): Date {
        if (jsonDate instanceof Date) return jsonDate;
        jsonDate = cde.CStr(jsonDate);
        if (jsonDate.substr(0, 2) === "\/") {
            const offset = new Date().getTimezoneOffset() * 60000;
            const parts: RegExpExecArray = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?.*/.exec(jsonDate); //NOSONAR Not Critical

            if (parts[2] === undefined)
                parts[2] = "0";

            if (parts[3] === undefined)
                parts[3] = "0";

            return new Date(+parts[1] + offset + parseInt(parts[2]) * 3600000 + parseInt(parts[3]) * 60000);
        }
        else {
            if (jsonDate.substr(0, 1) === "/")
                return new Date(parseInt(jsonDate.substr(6)));
            else
                return new Date(jsonDate);
        }
    }

    export function DoesArrayContain(pArray: string[], pCont: string): boolean {
        for (let i = 0; i < pArray.length; i++) {
            if (pArray[i] === pCont) return true;
        }
        return false;
    }

    export function SortArray<T>(pInArray: Array<T>, property: string, IsNumeric: boolean, pSortDescending: boolean): Array<T> {
        if (!pInArray) return [];
        const tArray = pInArray.slice(0);
        return tArray.sort((a, b) => {
            if (!a[property]) a[property] = "";
            if (!b[property]) b[property] = "";
            const c = IsNumeric ? parseFloat(a[property]) : a[property].toString();
            const d = IsNumeric ? parseFloat(b[property]) : b[property].toString();
            if (c === d) return 0;
            return pSortDescending ? d > c ? 1 : -1 : d < c ? 1 : -1;
        });
    }

    export function SortNamedArray<T>(pInArray: Array<T>, property: string, IsNumeric: boolean, pSortDescending: boolean): Array<T> {
        const tuples = [];
        const pOutArray: Array<T> = new Array<T>();
        try {
            for (const key in pInArray) tuples.push([key, pInArray[key]]);

            tuples.sort(function (a, b) {
                let aa = a[1].GetProperty(property);
                if (!aa) aa = "";
                let bb = b[1].GetProperty(property);
                if (!bb) bb = "";
                const c = IsNumeric ? parseFloat(aa) : aa.toString();
                const d = IsNumeric ? parseFloat(bb) : bb.toString();
                if (c === d) return 0;
                return pSortDescending ? d > c ? 1 : -1 : d < c ? 1 : -1;
            });

            for (let i = 0; i < tuples.length; i++) {
                const tkey = tuples[i][0];
                const tvalue = tuples[i][1];
                pOutArray[tkey] = tvalue;
            }
        }
        catch (ee) {
            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "nmiUtils:SortNamedArray:error:" + ee, ee.stack);
            return pInArray;
        }
        return pOutArray;
    }


    export function ResizeIframe(pEleName: string) {
        if (document.getElementById(pEleName)) {
            let height = document.documentElement.clientHeight;
            const wid = document.documentElement.clientWidth - 5;
            height -= (document.getElementById(pEleName).parentElement.offsetTop + 10);
            document.getElementById(pEleName).style.height = height + "px";
            document.getElementById(pEleName).style.width = wid + "px";
        }
    }

    export function cdeSleep(ms) {
        const dt = new Date();
        dt.setTime(dt.getTime() + ms);
        while (new Date().getTime() < dt.getTime());
    }

    export function StripHTML(inStr: string): string {
        const div = document.createElement("div");
        div.innerHTML = inStr;
        return div.textContent || div.innerText || "";
    }

    export function cdeRunAsync(MyFunc, pTimeDelay?: number, ...params: []) {
        if (!pTimeDelay || pTimeDelay === 0)
            MyFunc(params);
        else {
            setTimeout(MyFunc, pTimeDelay, params);
        }
    }


    export function DateToMini(inDate: Date): string {
        const month = inDate.getMonth() + 1;
        const day = inDate.getDate();
        const year = inDate.getFullYear();
        const hours = inDate.getHours();
        const minutes = inDate.getMinutes();
        const seconds = inDate.getSeconds();
        let ampm = "AM";
        if (hours > 11) {
            ampm = "PM";
        }
        return month + day + year + "_" + hours + "_" + minutes + "_" + seconds + "_" + ampm;
    }

    export function DateToString(inDate: Date): string {
        return cde.DateToString(inDate);
    }

    export function CalculateTransform(offsetX: number, offsetY: number) {
        const tileMid = 75;
        let tX;
        let tY;
        const tDegBase = 30;
        let tDeg;

        if ((offsetX < tileMid) && (offsetY < tileMid)) {
            tX = (offsetX - tileMid) / tileMid;
            tY = -(offsetY - tileMid) / tileMid;
            tDeg = Math.max((tDegBase * tX), (tDegBase * tY));
        } else if ((offsetX > tileMid) && (offsetY < tileMid)) {
            tX = -(offsetX - tileMid) / tileMid;
            tY = (offsetY - tileMid) / tileMid;
            tDeg = Math.max((tDegBase * tX), (tDegBase * tY));
        } else if ((offsetX < tileMid) && (offsetY > tileMid)) {
            tX = -(offsetX - tileMid) / tileMid;
            tY = (offsetY - tileMid) / tileMid;
            tDeg = -Math.max((tDegBase * tX), (tDegBase * tY));
        } else {
            tX = (offsetX - tileMid) / tileMid;
            tY = -(offsetY - tileMid) / tileMid;
            tDeg = -Math.max((tDegBase * tX), (tDegBase * tY));
        }

        return "rotate3d(" + tY + "," + tX + ", 0," + tDeg + "deg)";
    }






    export function Check4ValidPassword(pwd: string): boolean {
        if (!pwd || pwd.length === 0)
            return true;
        if (pwd.length < 8)
            return false;
        return true;
    }

    export function Check4ValidEmail(email: string): boolean {
        if (!email || email.length === 0)
            return true;
        const filter = new RegExp("([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\"\(\[\]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(\.[!#-'*+/-9=?A-Z^-~-]+)*|\[[\t -Z^-~]*])"); //NOSONAR RFC5322 validation
        if (!email || !filter.test(email.toLowerCase()) || email.substring(0, 1) === '.' || email.substring(email.length - 1, 1) === '.')
            return false;
        return true;
    }

    export function IsSamePassword(pPass1: string, pPass2: string, AllowMotLock: boolean): boolean {
        if ((!pPass1 || pPass1.length === 0) && (!pPass2 || pPass2.length === 0))
            return true;
        if ((!pPass1 && pPass2) || (pPass1 && !pPass2))
            return false;
        if (AllowMotLock && pPass1.indexOf(';') > 0) {
            if (!pPass2) return false;
            const MotLockParts: string[] = pPass1.split(';');
            const MotL2: string[] = pPass2.split(';');
            let IsMotLock = true;
            let i: number;
            for (i = 0; i < MotLockParts.length; i++) {
                if (MotLockParts[i].length === 0) {
                    IsMotLock = false;
                    break;
                }
            }
            if (IsMotLock) {
                for (i = 0; i < MotLockParts.length; i++) {
                    if (MotL2[i].length === 0)
                        return false;
                    const Arr1: string[] = MotLockParts[i].split('');
                    const Arr2: string[] = MotL2[i].split('');
                    if (Arr1.length !== Arr2.length)
                        return false;
                    Arr1.sort();
                    Arr2.sort();
                    for (let j = 0; j < Arr1.length; j++) {
                        if (Arr1[j] !== Arr2[j])
                            return false;
                    }
                }
                return true;
            }
        }
        if (pPass1 === pPass2)
            return true;
        return false;
    }

    export function CColorToHex(color: string): string {
        if (color.substr(0, 1) === '#') {
            return color;
        }
        const digits = /(.*?)rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(color); //NOSONAR Not Critical

        const red = parseInt(digits[2]);
        const green = parseInt(digits[3]);
        const blue = parseInt(digits[4]);

        const rgb = blue | (green << 8) | (red << 16);
        return digits[1] + '#' + rgb.toString(16);
    }

    export function HasPlaceholderSupport(): boolean {
        const input = document.createElement('input');
        return ('placeholder' in input);
    }

    export function cdeMinMax(pValue: number, sourceMax: number, sourceMin: number, targetMax: number, targetMin: number): number {
        pValue = (pValue - sourceMin) * (targetMax - targetMin) / (sourceMax - sourceMin) + targetMin;
        return pValue;
    }

    export function LoadJsCssFile(filename: string, filetype: string) {
        if (filetype === "js") {
            const fileref = document.createElement('script');
            fileref.setAttribute("type", "text/javascript");
            fileref.setAttribute("src", filename);
            document.getElementsByTagName("head")[0].appendChild(fileref);
        }
        else if (filetype === "css") {
            const cssfileref = document.createElement("link");
            cssfileref.setAttribute("rel", "stylesheet");
            cssfileref.setAttribute("type", "text/css");
            cssfileref.setAttribute("href", filename);
            document.getElementsByTagName("head")[0].appendChild(cssfileref);
        }
    }

    export function SortArrayEx<T>(pInArray: Array<T>, property: string, IsNumeric: boolean, pSortDescending: boolean): Array<T> {
        if (!pInArray) return [];
        const tArray = pInArray.slice(0);
        return tArray.sort((a, b) => {
            let c;
            let d;
            let ac;
            let bc;
            if (!IsNumeric) {
                const tProps: Array<string> = property.split(',');
                for (let i = 0; i < tProps.length; i++) {
                    ac = a[tProps[i]];
                    if (!ac) ac = "";
                    bc = b[tProps[i]];
                    if (!bc) bc = "";
                    if (c && c.length > 0) c += ".";
                    c += ac.toString();
                    if (d && d.length > 0) d += ".";
                    d += bc.toString();
                }
            }
            else {
                ac = a[property];
                if (!ac) ac = "";
                bc = b[property];
                if (!bc) bc = "";
                c = IsNumeric ? parseFloat(ac) : ac.toString();
                d = IsNumeric ? parseFloat(bc) : bc.toString();
            }
            if (c === d) return 0;
            return pSortDescending ? d > c ? 1 : -1 : d < c ? 1 : -1;
        });
    }


    const BASE64_MARKER = ';base64,';

    export function convertBase64ToBinary(dataURI: string): Uint8Array {
        const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        const base64 = dataURI.substring(base64Index);
        const raw = window.atob(base64);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));

        for (let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    }

    // Converts from degrees to radians.
    export function toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Converts from radians to degrees.
    export function toDegrees(radians) {
        return radians * 180 / Math.PI;
    }


    export function ValidateIPaddress(inputText: string): boolean {
        if (!inputText || inputText.length === 0)
            return true;
        const ipformat = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
        if (inputText.match(ipformat)) {
            return true;
        }
        return false;
    }

    export function ResetBrowserToPortal() {
        if (cde.MyCommChannel)
            cde.MyCommChannel.Logout();
        window.location.href = cde.MyBaseAssets.MyServiceHostInfo.PortalPage;
    }

    export function Vector2Distance(a: TheDrawingPoint, b: TheDrawingPoint) {
        return Math.sqrt(Math.pow(a.x - b.x, 2.0) + Math.pow(a.y - b.y, 2.0));
    }
    export function Vector2GetAngle(c: TheDrawingPoint, f: TheDrawingPoint): number {
        return (180.0 * (1.0 + (Math.atan2(c.y - f.y, c.x - f.x) / Math.PI)));
    }

    export function GetSizeFromTile(pTile: number, pDelta?: number): number {
        pTile = Math.floor(pTile);
        if (!pTile || pTile === 0) return 0;
        return (cde.MyBaseAssets.MyServiceHostInfo.TileSize * pTile);
    }

    export function NotifyHost(pText: string) {
        if (window.external) {
            try {
                const tWin: any = window;
                if (tWin.external.notify)
                    tWin.external.notify(pText);
            }
            catch (e) {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Show("Error: " + e, true);
            }
        }
    }

    export function GetControlFromPoint(x: number, y: number): INMIControl {
        let element: HTMLElement;
        const elements = [];
        let tResControl: INMIControl = null;
        const oldVisibility = [];
        while (true) {
            element = document.elementFromPoint(x, y) as HTMLElement;
            if (!element || element === document.documentElement) {
                break;
            }
            if (element.getAttribute("cdemid") && !tResControl) {
                const myNmiControl = cdeNMI.MyTCF.GetRegisteredControlGroup(element.getAttribute("cdemid")); 
                for (const tInfo in myNmiControl) {
                    if (myNmiControl.hasOwnProperty(tInfo)) {
                        tResControl = myNmiControl[tInfo];
                        break;
                    }
                }
            }
            elements.push(element);
            oldVisibility.push(element.style.visibility);
            element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
        }
        for (let k = 0; k < elements.length; k++) {
            elements[k].style.visibility = oldVisibility[k];
        }
        return tResControl;
    }

    export function GetAllElementsFromPoint(x: number, y: number) {
        let element;
        const elements = [];
        const oldVisibility = [];
        while (true) {
            element = document.elementFromPoint(x, y);
            if (!element || element === document.documentElement) {
                break;
            }
            elements.push(element);
            oldVisibility.push(element.style.visibility);
            element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
        }
        for (let k = 0; k < elements.length; k++) {
            elements[k].style.visibility = oldVisibility[k];
        }
        elements.reverse();
        return elements;
    }

    export function focusNextElement(goBack: boolean) {
        const focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
        const focussable = Array.prototype.filter.call(document.querySelectorAll(focussableElements),
            function (element) {
                return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
            });
        const index = focussable.indexOf(document.activeElement);
        if (index > -1) {
            if (goBack === true) {
                const nextElement = focussable[index - 1] || focussable[0];
                nextElement.focus();
            } else {
                const nextElement = focussable[index + 1] || focussable[0];
                nextElement.focus();
            }
        } else {
            focussable[0].focus();
        }
    }
}

