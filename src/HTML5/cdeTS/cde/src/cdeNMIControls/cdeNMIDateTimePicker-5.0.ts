// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿declare const flatpickr;
declare const monthSelectPlugin;

namespace cdeNMI {
    export class ctrlDateTimePicker extends TheNMIBaseControl implements INMIComboBox {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        public NeedRefresh = false;

        myPicker = null;
        mFrameDiv: HTMLDivElement = null;
        MyEditBox: HTMLInputElement = null;
        mWidSub = 20;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.ComboBox;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            this.SetProperty("HasChoices", false);

            this.mFrameDiv = document.createElement("div");
            //this.mFrameDiv.style.margin = "auto";
            this.mFrameDiv.style.width = "inherit";
            this.mFrameDiv.style.height = "inherit";
            this.mFrameDiv.className = "ctrlInput";
            this.SetElement(this.mFrameDiv);

            this.MyEditBox = document.createElement("input");
            this.MyEditBox.style.cssFloat = "left";
            this.MyEditBox.id = "DTP" + cde.GuidToString(this.MyFieldInfo.cdeMID)
            if (!cde.CBool(this.GetProperty("EnableAutoFill")) && !cde.CBool(this.GetProperty("InTemplate"))) {
                this.MyEditBox.name = "EB" + cde.GuidToString(this.MyFieldInfo.cdeMID) + "_" + Math.floor((Math.random() * 1000) + 1)
                this.MyEditBox.autocomplete = "new-password";
            }

            if (cde.CBool(this.GetSetting("NoTE"))) {
                const tLabel: HTMLLabelElement = document.createElement("label") as HTMLLabelElement;
                tLabel.htmlFor = "cdeIMP" + cde.GuidToString(this.MyFieldInfo.cdeMID);
                tLabel.className = "cdeTesInput";
                tLabel.appendChild(this.MyEditBox);
                const tSpanLabel = document.createElement("span");
                tSpanLabel.className = "label";
                tSpanLabel.innerHTML = this.GetSetting("Title");
                tLabel.appendChild(tSpanLabel);
                const tSpanFocus = document.createElement("span");
                tSpanFocus.className = "focus-bg";
                tLabel.appendChild(tSpanFocus);
                this.mWidSub = 25;
                this.mFrameDiv.appendChild(tLabel);
            }
            else {
                this.mFrameDiv.appendChild(this.MyEditBox);
                this.MyEditBox.className = "cdeInput";
            }

            this.MyEditBox.className = "cdeInput flatpickr flatpickr-input";
            if (cde.CInt(this.GetSetting("TileFactorY")) > 1 && !this.MyEditBox.classList.contains("cdeSmall"))
                this.MyEditBox.classList.add("cdeSmall");

            if (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) === 0)
                this.SetProperty("Disabled", true);
            return true;
        }

        ShowComboPicker() {
            if (this.myPicker)
                this.myPicker.show();
        }

        public ApplySkin() {
            const pickOptions = {
                mode: "single",
                enableTime: true,
                noCalendar: false,
                time_24hr: true,
                showMonths: 1,
                dateFormat: "Y-m-d H:i",
                onChange: (selectedDates, tRealVal) => { //selectedDates, tRealVal, instance
                    if ((tRealVal && tRealVal !== "") && this.GetProperty("Value") !== tRealVal) {
                        this.IsDirty = true;
                        this.SetProperty("Value", tRealVal);
                        ///this.FireEvent(false, "OnValueChanged", event, this.GetProperty("Value"), this.MyTRF);
                    }
                },
                plugins: []
            };
            if (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) !== 0) {
                switch (this.MyFieldInfo.Type) {
                    case cdeControlType.Month:
                        pickOptions.plugins = [
                            new monthSelectPlugin({
                                shorthand: true, //defaults to false
                                dateFormat: "F", //defaults to "F Y"
                                altFormat: "F Y", //defaults to "F Y"
                                theme: "dark" // defaults to "light"
                            })
                        ];
                        break;
                    case cdeControlType.TimeSpan:
                        pickOptions.mode = "range";
                        break;
                    case cdeControlType.Time:
                        pickOptions.noCalendar = true;
                        pickOptions.dateFormat = "H:i";
                        break;
                    case cdeControlType.DateTime:
                        if (!cde.CBool(this.GetProperty("DateOnly"))) {
                            pickOptions.enableTime = false;
                        }
                        break;
                }
            }
            this.myPicker = flatpickr(this.MyEditBox, pickOptions);
        }

        public SetProperty(pName: string, pValue) {
            if ((pName === "Value" || pName === "iValue") && pValue !== null) {
                if (this.MyEditBox) {
                    this.MyEditBox.value = this.ShowFieldContent(pValue);
                }
                this.IsDirty = true;
            } else if (pName === "Disabled" && this.MyEditBox) {
                if ((!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0))
                    pValue = true;
                this.MyEditBox.disabled = cde.CBool(pValue);
            } else if (pName === "Background" && this.MyEditBox && pValue) {
                this.MyEditBox.style.background = pValue;
            } else if (pName === "MainBackground" && this.MyEditBox && pValue) {
                this.MyEditBox.parentElement.style.background = pValue;
            } else if (pName === "Foreground" && this.MyEditBox && pValue) {
                this.MyEditBox.style.color = pValue;
            } else if (pName === "InnerClassName" && this.MyEditBox && pValue) {
                this.MyEditBox.className = pValue;
            } else if (pName === "InnerStyle" && this.MyEditBox && pValue) {
                this.MyEditBox.style.cssText = pValue;
            } else if (pName === "Z-Index" && this.MyEditBox) {
                this.MyEditBox.style.zIndex = pValue.toString();
            }
            super.SetProperty(pName, pValue);
        }
    }
}