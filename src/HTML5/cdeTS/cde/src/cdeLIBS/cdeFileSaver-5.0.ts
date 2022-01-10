// SPDX-FileCopyrightText: Eli Grey
//
// SPDX-License-Identifier: MIT

/* original code: FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.8
 * 2018 - 03 - 22 14: 03: 47
 *
 * By Eli Grey, https://eligrey.com
 * License: MIT
 * See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 * @source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js */
//
//      ported to TypeScript by Chris Muench
//Language:
//      neutral in NMI - verified
//CSS Styles: none
//Dependencies: none
//Version History
//      4.109: Initial Drop
//////////////////////////////////////////////////////////////////////////////

namespace cde {

    export class cdeFileSaver extends cde.TheDataBase {

        public SaveAs(blob, name: string, noAutoBom?: boolean) {
            //if (window.navigator && window.navigator.msSaveOrOpenBlob) { //IE11+
            //    window.navigator.msSaveOrOpenBlob(blob, name);
            //    return;
            //}
            if (cde.IsIE()) {
                if (cdeNMI.MyToast)
                    cdeNMI.MyToast.ShowToastMessage("Sorry...but IE does not support saving files!");
                return;
            }

            if (!noAutoBom) {
                this.blob = this.AutoBom(blob);
            } else
                this.blob = blob;
            const view: any = window;
            this.isSafari = /constructor/i.test(view.HTMLElement) || view.safari;
            this.isChromeIos = /CriOS\/[\d]+/.test(navigator.userAgent);
            this.force = blob.type === this.force_saveable_type;

            try {
                if (this.can_use_save_link) {
                    this.ObjectUrl = this.GetURL().createObjectURL(blob);
                    window.setTimeout(() => {   //setImmediate did not work correctly
                        this.save_link.href = this.ObjectUrl;
                        this.save_link.download = name;
                        this.click(this.save_link);
                        this.DispatchAll();
                        this.revoke(this.ObjectUrl);
                        this.readyState = "DONE";
                    }, 0);
                    return;
                }
            }
            catch (ex) {
                //ignored
            }
            this.FsError();
        }

        blob = null;
        force = false;
        ObjectUrl: string;
        readyState = "INIT";
        isSafari = false;
        isChromeIos = false;
        save_link: HTMLAnchorElement = document.createElementNS("http://www.w3.org/1999/xhtml", "a") as HTMLAnchorElement;
        can_use_save_link = "download" in this.save_link;
        //MySetImmediate = window.setTimeout; //window.setImmediate ||
        force_saveable_type = "application/octet-stream";
        arbitrary_revoke_timeout = 1000 * 40; // in ms

        GetURL() {
            return window.URL || (<any>window).webkitURL || window;
        };

        click(node) {
            const event = new MouseEvent("click");
            node.dispatchEvent(event);
        }

        revoker(file) {
            if (typeof file === "string") { // file is an object URL
                this.GetURL().revokeObjectURL(file);
            } else { // file is a File
                file.remove();
            }
        }
        // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
        revoke(file) {
            setTimeout(() => this.revoker(file), this.arbitrary_revoke_timeout);
        }

        AutoBom(blob) {
            // prepend BOM for UTF-8 XML and text/* types (including HTML)
            // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
            if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                return new Blob([String.fromCharCode(0xFEFF), blob], { type: blob.type });
            }
            return blob;
        }

        dispatch(filesaver, eventTypes, event) {
            eventTypes = [].concat(eventTypes);
            let i = eventTypes.length;
            while (i--) {
                const listener = filesaver["on" + eventTypes[i]];
                if (typeof listener === "function") {
                    try {
                        listener.call(filesaver, event || filesaver);
                    } catch (ex) {
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "FileSaver", "dispatch failed: " + ex + ":" + ex.stack);
                    }
                }
            }
        }

        DispatchAll() {
            this.dispatch(this, "writestart progress write writeend".split(" "), null);
        }

        // First try a.download, then web filesystem, then object URLs
        FsError() {
            if ((this.isChromeIos || (this.force && this.isSafari)) && (<any>window).FileReader) {
                // Safari doesn't allow downloading of blob urls
                const reader = new FileReader();
                reader.onloadend = () => {
                    let url: string = (this.isChromeIos ? reader.result : (reader.result as string).replace(/^data:[^;]*;/, 'data:attachment/file;')) as string;
                    const popup = window.open(url, '_blank');
                    if (!popup) window.location.href = url;
                    url = undefined; // release reference before dispatching
                    this.readyState = "DONE";
                    this.DispatchAll();
                };
                reader.readAsDataURL(this.blob);
                this.readyState = "INIT";
                return;
            }
            // don't create more object URLs than needed
            if (!this.ObjectUrl) {
                this.ObjectUrl = this.GetURL().createObjectURL(this.blob);
            }
            if (this.force) {
                window.location.href = this.ObjectUrl;
            } else {
                let opened
                try {
                    opened = window.open(this.ObjectUrl, "_blank");
                }
                catch {
                    //ignored
                }
                if (!opened) {
                    // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
                    window.location.href = this.ObjectUrl;
                }
            }
            this.readyState = "DONE";
            this.DispatchAll();
            this.revoke(this.ObjectUrl);
        }
    }
}