// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿declare const Choices;
const cdeSortAlphabet = '*!@_.()#^&%-=+01234567989abcdefghijklmnopqrstuvwxyz';

namespace cdeNMI {
    export class ctrlComboBox extends TheNMIBaseControl implements INMIComboBox {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        MyComboBox: HTMLSelectElement = null;
        MyComboDiv: HTMLDivElement = null;
        HasGroups = false;
        MyTableName: string = null;
        MyLookup: TheComboLookup = null;
        HideInput = false;
        NeedRefresh = false;
        WasInputCreated = false;
        HasLoaded = false;
        DoShow = false;
        DontFire = false;

        MySep = ";";
        ControlText = "ctrlComboBox";
        RefreshCombo = '[{"V":"CDE_NOP","N":"loading...please wait"}]';

        MyCurrentData: Array<TheComboOption>;


        myChoices = null;
        myChoicesOptions = {
            delimiter: this.MySep,
            editItems: false,
            maxItemCount: 1,
            removeItemButton: false,
            searchEnabled: false,
            shouldSort: true,
            searchResultLimit: 100,
            shouldSortItems: true,
            duplicateItemsAllowed: false,
            position: "bottom",
            fuseOptions: {
                ignoreLocation: true,
                threshold: 0.1,
                location: 0,
                distance: 1000,
            },
            sorter: function (a, b) {
                const indexA = cdeSortAlphabet.indexOf(a[0]),
                    indexB = cdeSortAlphabet.indexOf(b[0]);

                if (indexA === indexB) {
                    // same first character, sort regular
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    }
                    return 0;
                } else {
                    return indexA - indexB;
                }
            }
        };

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            if (this.MyBaseType === cdeControlType.BaseControl)
                this.MyBaseType = cdeControlType.ComboBox;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            this.SetProperty("HasChoices", false);

            if (this.MyFieldInfo && this.MyFieldInfo["DefaultValue"] && !this.MyFieldInfo["Value"])
                this.MyFieldInfo["Value"] = this.MyFieldInfo["DefaultValue"];
            if (this.MyFieldInfo && this.MyFieldInfo["HideInput"])
                this.HideInput = true;
            if (this.MyFieldInfo)
                super.SetProperty("UXID", this.MyFieldInfo.cdeMID);

            this.CalculateOption(null);

            this.RegisterEvent("OnDelete", () => {
                cdeNMI.MyEngine.UnregisterLazyLoader(this.MyScreenID, this.MyTableName, this.HandleLazyLoad);
            });
            return true;
        }

        public AddChoice(pValue: TheComboOption): boolean {
            if (!pValue) return false;
            let tEx: Array<TheComboOption>;
            if (this.MyCurrentData.length > 0) {
                tEx = this.MyCurrentData.filter(element => element.value === pValue.value);
            }
            if (!tEx || tEx.length === 0) {
                this.MyCurrentData.push(pValue);
                return true;
            } else {
                tEx.forEach((vl: TheComboOption) => {
                    if (vl.label === vl.value && vl.label !== pValue.label)
                        vl.label = pValue.label;
                });
            }
            return false;
        }

        public SetProperty(pName: string, pValue) {
            if ((pName === "Value" || pName === "iValue") && pValue !== null) {
                if (this.myChoices) {
                    const tChoices = pValue.split(this.MySep);
                    this.DontFire = true;
                    try {
                        for (let i = 0; i < tChoices.length; i++) {
                            const tC = new TheComboOption();
                            tC.value = tChoices[i];
                            tC.label = tChoices[i];
                            this.AddChoice(tC);
                        }
                        if (this.MyCurrentData.length > 0) {
                            this.myChoices.setChoices(this.MyCurrentData, "value", "label", true);
                            this.myChoices.removeActiveItems();
                            this.myChoices.setChoiceByValue(tChoices);
                        }
                        //const tH=this.myChoices.items;
                    } catch {
                        //empty
                    }
                    this.DontFire = false;
                }
                this.IsDirty = true;
            } else if ((pName === "SetChoice" || pName === "SetChoiceV") && pValue) {
                //TODO: Find pValue in MyCurrentData. If not add to 
                this.AddChoice(pValue);
                this.DontFire = true;
                this.myChoices.setChoices(this.MyCurrentData, "value", "label", true);
                this.myChoices.setChoiceByValue(pValue.value);
                this.DontFire = false;
                if (pName === "SetChoiceV")
                    super.SetProperty("Value", pValue.value);
                return;
            } else if (pName === "LiveOptions" && pValue) {
                super.SetProperty(pName, pValue);
                this.ShowComboPicker();
                return;
            } else if (pName === "ScreenFriendlyName" && pValue) {
                let tO = this.GetProperty("LiveOptions");
                if (!tO)
                    tO = pValue;
                else
                    tO += this.MySep + pValue;
                this.SetProperty("LiveOptions", tO);
                this.MyComboBox.value = tO.split(':')[0];
                return;
            } else if (pName === "Background" && this.MyComboBox && pValue) {
                this.MyComboBox.style.background = pValue;
            } else if (pName === "MainBackground" && this.MyComboDiv && pValue) {
                this.MyComboDiv.parentElement.style.background = pValue;
            } else if (pName === "Foreground" && this.MyComboBox && pValue) {
                this.MyComboBox.style.color = pValue;
            } else if (pName === "InnerClassName" && this.MyComboBox && pValue) {
                this.MyComboBox.className = pValue;
            } else if (pName === "InnerStyle" && this.MyComboBox && pValue) {
                this.MyComboBox.style.cssText = pValue;
            } else if (pName === "Options" && this.MyComboDiv) {
                this.MyFieldInfo["OptionsLive"] = pValue;
                if (this.myChoices)
                    this.CreateComboOptions(pValue, null, false);
                else
                    this.CalculateOption(pValue);
            } else if (pName === "Z-Index" && this.MyComboBox) {
                this.MyComboBox.style.zIndex = pValue.toString();
            } else if (pName === "Separator") {
                this.MySep = pValue;
            }
            super.SetProperty(pName, pValue);
        }

        HandleLazyLoad(table, pCookie) {
            const tComboControl: ctrlComboBox = pCookie.ComboControl as ctrlComboBox;
            if (table)
                tComboControl.HasLoaded = true;
            tComboControl.CreateComboFromLookup(table, pCookie);
            if (!table || !tComboControl.myChoices) {
                tComboControl.SetProperty("HasChoices", true);
                tComboControl.NeedRefresh = true;
                tComboControl.ApplySkiny();
            }
        }

        public CalculateOption(tChoiceOptions: string) {
            if (this.myChoices)
                return;

            if (this.MyFieldInfo) {
                if (this.MyFieldInfo["OptionsLive"])
                    tChoiceOptions = this.MyFieldInfo["OptionsLive"];
                if (!tChoiceOptions)
                    tChoiceOptions = this.MyFieldInfo["Options"];
                if (!tChoiceOptions)
                    tChoiceOptions = "No Options Specified:CDE_NOP";
            }

            let SortOptions = false;
            if (this.MyFieldInfo) {
                this.MyBaseType = this.MyFieldInfo.Type;
                switch (this.MyFieldInfo.Type) {
                    case cdeControlType.YesNo:
                        tChoiceOptions = "Yes:Y;No:N";
                        if (cde.CBool(this.GetProperty("IncludeNA")))
                            tChoiceOptions += ";N/A:A";
                        break;
                    case cdeControlType.TrueFalse:
                        tChoiceOptions = "True;False";
                        break;
                    case cdeControlType.Month: //Months
                        this.myChoicesOptions.searchEnabled = true;
                        tChoiceOptions = "January;Feburary;March;April;May;June;July;August;September;October;November;December";
                        break;
                    case cdeControlType.Country:
                        {
                            this.myChoicesOptions.searchEnabled = true;
                            const states = ["United States", "Germany", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antarctica", "Antigua and Barbuda", "Argentina",
                                "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda",
                                "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burma", "Burundi", "Cambodia", "Cameroon",
                                "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic",
                                "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica",
                                "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland",
                                "France", "Gabon", "Gambia", "Georgia", "Ghana", "Greece", "Greenland", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
                                "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
                                "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
                                "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
                                "Mauritius", "Mexico", "Micronesia", "Moldova", "Mongolia", "Morocco", "Monaco", "Mozambique", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
                                "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
                                "Qatar", "Romania", "Russia", "Rwanda", "Samoa", "San Marino", " Sao Tome", "Saudi Arabia", "Senegal", "Serbia and Montenegro", "Seychelles",
                                "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname",
                                "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
                                "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam",
                                "Yemen", "Zambia", "Zimbabwe"];
                            tChoiceOptions = "";
                            for (const idx in states) {
                                if (tChoiceOptions.length > 0) tChoiceOptions += ";";
                                tChoiceOptions += states[idx];
                            }
                        }
                        break;
                    default:
                        this.myChoicesOptions.searchEnabled = false;
                        SortOptions = true;
                        break;
                }
            }
            if (tChoiceOptions) {
                if (!this.MyComboDiv) {
                    this.MyComboDiv = document.createElement("div");
                    this.MyComboDiv.className = "cdeComboBox";
                    this.SetElement(this.MyComboDiv);
                }
                if (!this.MyComboBox) {
                    this.MyComboBox = document.createElement("select");
                    this.MyComboBox.id = cde.GuidToString(this.GetProperty("ID"));;
                    if (this.MyFieldInfo.Type === cdeControlType.ComboOption) {
                        this.MyComboBox.multiple = true;
                    }
                    this.MyComboDiv.appendChild(this.MyComboBox);
                }
                if (tChoiceOptions.substr(0, 6) === "LOOKUP") {
                    let tParas: string[] = tChoiceOptions.split(':');
                    if (tParas.length > 1) {
                        switch (tParas[1]) {
                            case "THINGPICKER":
                                tParas = "LOOKUP:b510837f-3b75-4cf2-a900-d36c19113a13:MyPropertyBag.FriendlyName.Value:cdeMID:MyPropertyBag.DeviceType.Value:FAFA22FF-96AC-42CF-B1DB-7C073053FC39".split(':');
                                break;
                            case "PROPERTYPICKER":
                                this.SetProperty("UXID", this.MyFieldInfo.cdeMID);
                                this.RegisterNMIControl();
                                tParas = null;
                                this.CreateComboOptions("Loading please wait...:CDE_NOP", "CDE_NOP", false);
                                break;
                        }
                    }
                    if (tParas) {
                        if (tParas.length < 3) {
                            this.CreateComboOptions("Lookup definition incomplete:CDE_NOP", "CDE_NOP", false);
                        } else {
                            let tScreenid: string = this.MyScreenID;
                            if (tParas.length > 5) tScreenid = tParas[5];
                            this.MyScreenID = cde.GuidToString(tScreenid);
                            this.MyTableName = cde.GuidToString(tParas[1]);
                            let tGName = null;
                            if (tParas.length > 4)
                                tGName = tParas[4];
                            if (!this.MyLookup) {
                                this.MyLookup = { ComboControl: this, Content: this.GetProperty("Value"), SrcFld: tParas[2], TgtID: tParas[3], GroupName: tGName };
                            }
                            //this.CreateComboOptions('[{"V":"CDE_LLL","N":"Select to Load Lookup Table"}]', "CDE_LLL", false);
                            if (cdeNMI.MyEngine) {
                                cdeNMI.MyEngine.LoadTableLazy(this.MyScreenID, this.MyTableName, this.HandleLazyLoad, this.MyLookup);
                                return;
                            }
                        }
                    }
                }
                else {
                    if (!this.CalPicker())
                        this.CreateComboOptions(tChoiceOptions, this.GetProperty("Value"), SortOptions);
                }
                this.SetProperty("HasChoices", true);
                this.ApplySkiny();
            }
        }

        public ApplySkin() {
            this.ApplySkiny();
        }

        public OnShowDropDown() {
            this.myChoices.setChoices(this.MyCurrentData, "value", "label", true);
            if (this.NeedRefresh)
                this.CalculateOption(null);
            if (this.HasGroups)
                return;
            if (cde.IsNotSet(this.GetProperty("Value"))) {
                if (this.MyLookup !== null)
                    this.myChoices.setChoiceByValue("CDE_LLL");
                else {
                    if (this.GetProperty("Options").substr("CDE_NOP") > 0)
                        this.myChoices.setChoiceByValue("CDE_NOP");
                }
            } else
                this.myChoices.setChoiceByValue(this.GetProperty("Value"));
        }

        public SetOptions() {
            if (this.MyFieldInfo.Type === cdeControlType.ComboOption) {
                this.myChoicesOptions.editItems = false;
                this.myChoicesOptions.removeItemButton = true;
                this.myChoicesOptions.maxItemCount = 1;
            }
        }

        public ApplySkiny() {
            if (this.myChoices && this.NeedRefresh === false)
                return;
            try {
                if (!this.myChoices && Choices) {
                    this.SetOptions();
                    if (cde.CBool(this.GetProperty("AllowMultiSelect")))
                        this.myChoicesOptions.maxItemCount = -1;
                    if (this.GetProperty("Separator")) {
                        this.myChoicesOptions.delimiter = this.GetProperty("Separator");
                        this.MySep = this.myChoicesOptions.delimiter;
                    }
                    this.myChoices = new Choices(this.MyComboBox, this.myChoicesOptions);
                    this.myChoices.setChoices(this.MyCurrentData, "value", "label", true);
                    if (!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0) {
                        this.myChoices.disable();
                    } else {
                        this.myChoices.passedElement.element.addEventListener(
                            'showDropdown',
                            () => {
                                this.OnShowDropDown();
                            },
                            false,
                        );
                        if (this.MyFieldInfo.Type === cdeControlType.ComboOption && cde.CBool(this.GetProperty("AllowNewEntry")) === true) {
                            this.myChoices.passedElement.element.addEventListener(
                                'search',
                                (event) => {
                                    const tRealVal: string = event.detail.value;
                                    //const myC = this.MyCurrentData;
                                    const tCI = new TheComboOption();
                                    tCI.label = tRealVal;
                                    tCI.value = tRealVal;
                                    //myC.push(tCI);
                                    this.myChoices.setChoices([tCI], "value", "label", true);
                                },
                                false,
                            );
                        }
                        this.myChoices.passedElement.element.addEventListener(
                            'removeItem',
                            (event) => {
                                if (this.DontFire === true || !cde.CBool(this.GetProperty("AllowMultiSelect")))
                                    return;
                                const tRealVal: string = event.detail.value;
                                this.ComboUpdateValue(tRealVal, true);
                            },
                            false,
                        );
                        this.myChoices.passedElement.element.addEventListener(
                            'choice',
                            (event) => {
                                if (this.DontFire === true)
                                    return;
                                const tRealVal: string = event.detail.choice.value;
                                if (this.GetProperty("Value") !== tRealVal) {
                                    if (!this.ComboUpdateValue(tRealVal)) {
                                        event.detail.choice.disabled = true;
                                        event.preventDefault();
                                        return false;
                                    }
                                }
                            },
                            false,
                        );
                    }
                } else {
                    this.myChoices.clearChoices();
                    this.myChoices.setChoices(this.MyCurrentData, "value", "label", true);
                }
                this.SetToDefault(true);
            } catch (e) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", this.ControlText + ":ApplySkiny", "Exception :" + e);
            }
        }

        public CalPicker(): boolean {
            let tLO: string = this.GetProperty("OptionsLive");
            if (!tLO)
                tLO = this.GetProperty("Options");
            if (tLO && tLO.startsWith("SCREENPICKER")) {
                let tLst: string = tLO.substr(13);
                if (cdeNMI.MyScreenManager)
                    tLst += cdeNMI.MyScreenManager.GetScreenList();
                super.SetProperty("OptionsLive", tLst);
                super.SetProperty("LiveOptions", tLst);
                this.CreateComboOptions(tLst, this.GetProperty("Value"), true);
                this.ApplySkiny();
                return true;
            }
            return false;
        }

        public CreateComboOptions(pChoiceOptions: string, pContent, SortOptions: boolean) {
            if (!pChoiceOptions) return;

            this.MyCurrentData = new Array<TheComboOption>();
            this.HasGroups = false;

            let tOpt: TheComboOption;
            let i: number;
            if (pChoiceOptions.substr(0, 1) === "[") {
                const tJOpgs = JSON.parse(pChoiceOptions);
                for (i = 0; i < tJOpgs.length; i++) {
                    tOpt = new TheComboOption;
                    tOpt.value = tJOpgs[i].V;
                    let tPrefix = "";
                    if (tOpt.value.startsWith("CDE_"))
                        tPrefix = "===> ";
                    if (tJOpgs[i].G || this.HasGroups) {
                        if (tJOpgs[i].G) {
                            tOpt.group = tJOpgs[i].G;
                            this.HasGroups = true;
                        } else {
                            tOpt.group = "No Group";
                        }
                    }
                    if (tJOpgs[i].H)
                        tOpt.html = tJOpgs[i].H;
                    else
                        tOpt.label = tPrefix + tJOpgs[i].N.replace('_', ' ');
                    tOpt.disabled = cde.CBool(tJOpgs[i].D);

                    this.MyCurrentData.push(tOpt);
                }
            }
            else {
                const tGroups: string[] = pChoiceOptions.split(';:;');
                if (tGroups.length > 1) {
                    this.HasGroups = true;
                    tGroups.sort();
                }
                let tOps: string[];
                for (let tGrp = 0; tGrp < tGroups.length; tGrp++) {
                    let tOption = tGroups[tGrp];
                    if (this.HasGroups) {
                        tOps = tGroups[tGrp].split(this.MySep);
                        if (tOps.length > 1)
                            tOption = tOps[1];
                    }
                    tOps = tOption.split(this.MySep);
                    if (SortOptions)
                        tOps.sort();
                    for (i = 0; i < tOps.length; i++) {
                        const tOptVal: string[] = tOps[i].split(':');
                        tOpt = new TheComboOption;
                        if (tOptVal.length > 1)
                            tOpt.value = tOptVal[1];
                        else
                            tOpt.value = tOptVal[0];
                        if (this.HasGroups)
                            tOpt.group = tOps[0];
                        tOpt.label = tOptVal[0].replace('_', ' ');
                        this.MyCurrentData.push(tOpt);
                    }
                }
            }
            if (this.HasGroups === true) {
                this.BuildGroups();
            }
        }

        public BuildGroups() {
            let id = 1;
            const newData: TheComboOption[] = [];
            for (let i = 0; i < this.MyCurrentData.length; i++) {
                const tOpt: TheComboOption = this.MyCurrentData[i];
                const tGroups = newData.filter(e => e.label === tOpt.group);
                if (tGroups.length > 0) {
                    tGroups[0].choices.push(tOpt);
                } else {
                    const tNewGroup: TheComboOption = new TheComboOption();
                   //tNewGroup.disabled = true;
                    tNewGroup.id = id;
                    id++;
                    tNewGroup.value = tOpt.group
                    tNewGroup.label = tOpt.group;
                    tNewGroup.choices = [];
                    tNewGroup.choices.push(tOpt);
                    newData.push(tNewGroup);
                }
            }
            this.MyCurrentData = newData;
        }


        public CreateComboFromLookup(pMyStorageMirror, pCookie: TheComboLookup) {
            let tArray = [];
            const tComboControl: ctrlComboBox = pCookie.ComboControl as ctrlComboBox;
            if (!pMyStorageMirror) {
                if (pCookie.GroupName)
                    tComboControl.CreateComboOptions('[{"G":"Other Options...","V":"CDE_LLL","N":"Loading, please wait..."}]', "CDE_LLL", false); //"G":"Other Options...",
                else
                    tComboControl.CreateComboOptions('[{"V":"CDE_LLL","N":"Loading, please wait..."}]', "CDE_LLL", false); //"G":"Other Options...",
                if (!this.myChoices)
                    this.ComboUpdateValue("CDE_LLL");
                return;
            }
            let tOpt: TheComboOption;
            try {
                const tGroupLookup: string = this.GetProperty("GroupLookup");
                const tFilter: string = this.GetProperty("Filter"); //"Platform=2"; // 
                let tFilterFld: string = null;
                let tFilterVal: Array<string> = [];
                if (tFilter && tFilter.split('=').length > 1) {
                    tFilterFld = tFilter.split('=')[0];
                    const tFVal = tFilter.split('=')[1];
                    if (tFVal.substr(0, 1) === "[")
                        tFilterVal = JSON.parse(tFVal);
                    else
                        tFilterVal[0] = tFVal;
                }
                tComboControl.MyCurrentData = new Array<TheComboOption>();
                if (pCookie.GroupName) { //Has Groups
                    tComboControl.HasGroups = true;
                }
                let row: number;
                for (row = 0; row < pMyStorageMirror.length; row++) {
                    const tRow = pMyStorageMirror[row];
                    if (tRow[tFilterFld] && tFilterVal.length > 0) {
                        let tFound = false;
                        for (let iii = 0; iii < tFilterVal.length; iii++) {
                            if (tRow[tFilterFld] === tFilterVal[iii]) {
                                tFound = true;
                                break;
                            }
                        }
                        if (!tFound)
                            continue;
                    }
                    if (tComboControl.HasGroups) {
                        const tGroup: string = cdeNMI.GetFldContentByName(tRow, pCookie.GroupName, false);
                        if (tGroup && tGroup !== "")
                            tArray.push(tRow);
                    }
                    else {
                        const tName: string = cdeNMI.GetFldContentByName(tRow, pCookie.SrcFld, false);
                        if (tName && tName !== "")
                            tArray.push(tRow);
                    }
                }
                if (tComboControl.HasGroups)
                    tArray = cdeNMI.SortArrayByProperty(tArray, pCookie.GroupName, false, false);
                else
                    tArray = cdeNMI.SortArrayByProperty(tArray, pCookie.SrcFld, false, false);

                for (row = 0; row < tArray.length; row++) {
                    tOpt = new TheComboOption();
                    if (tComboControl.HasGroups) {
                        let tGR = cdeNMI.GetFldContentByName(tArray[row], pCookie.GroupName, false);
                        if (tGroupLookup)
                            tGR = this.GetTextFromOptions(tGR, tGroupLookup);
                        tOpt.group = tGR;
                    }
                    const tText: string = cdeNMI.GetFldContentByName(tArray[row], pCookie.SrcFld, false);
                    let tVal: string = tText;
                    if (pCookie.TgtID)
                        tVal = cdeNMI.GetFldContentByName(tArray[row], pCookie.TgtID, false);
                    if (!cde.IsNotSet(tVal))
                        tOpt.value = tVal;
                    tOpt.label = tText;
                    tComboControl.MyCurrentData.push(tOpt);
                }
            }
            catch (eee) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", this.ControlText + ":CreateComboFromLookup:AssembleData", eee);
            }

            if (cde.CBool(tComboControl.GetProperty("RefreshOnLoad")) !== true) {
                tOpt = new TheComboOption();
                if (tComboControl.HasGroups) {
                    tOpt.group = "Other Options...";
                }
                tOpt.value = 'CDE_LLL';
                tOpt.label = "--- Select to Load Lookup Table ---";
                tComboControl.MyCurrentData.push(tOpt);
            }

            if (cde.CBool(tComboControl.GetProperty("AddEmptyEntry")) === true) {
                tOpt = new TheComboOption();
                if (tComboControl.HasGroups) {
                    tOpt.group = "Other Options...";
                }
                tOpt.value = 'CDE_NOP';
                tOpt.label = "- empty -";
                tComboControl.MyCurrentData.push(tOpt);
            }

            if ((tComboControl.MyFieldInfo.Flags & 2) === 0)
                tComboControl.MyComboBox.disabled = true;
            if (tComboControl.myChoices) {
                try {
                    tComboControl.myChoices.setChoices(tComboControl.MyCurrentData, "value", "label", true);
                }
                catch (eee) {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", this.ControlText + ":CreateComboFromLookup", eee);
                    tComboControl.NeedRefresh = true;
                    tComboControl.ApplySkiny();
                }
            }
        }

        GetTextFromOptions(pContent: string, pOptions: string): string {
            const tOps: string[] = pOptions.split(this.MySep);
            for (let i = 0; i < tOps.length; i++) {
                const tOptVal: string[] = tOps[i].split(':');
                if (tOptVal.length > 1) {
                    if (pContent === tOptVal[1] || ((!pContent || pContent === '') && tOptVal[1] === '0'))
                        return tOptVal[0];
                }
                else {
                    if (pContent === tOptVal[0])
                        return tOptVal[0];
                }
            }
            return pContent;
        }

        ShowComboPicker() {
            if (this.MyFieldInfo && this.MyFieldInfo["OptionsLive"]) {
                let tChoiceOptions: string = this.MyFieldInfo["OptionsLive"];
                const tParas: string[] = tChoiceOptions.split(':');
                if (tParas.length > 1) {
                    switch (tParas[1]) {
                        case "PROPERTYPICKER":
                            tChoiceOptions = this.GetProperty("LiveOptions");
                            if (!tChoiceOptions) {
                                if (tParas[2].length > 0) {
                                    if (cdeNMI.MyEngine) {
                                        cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:PROPERTYPICKER:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ':' + tParas[2], '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                                        tChoiceOptions = "loading ... please wait";
                                    }
                                    else {
                                        tChoiceOptions = "No NMI Engine available - cannot load";
                                    }
                                } else {
                                    tChoiceOptions = "You have to Select a Thing first";
                                }
                            }
                            else {
                                this.CreateComboOptions(tChoiceOptions, this.GetProperty("Value"), true);
                                this.NeedRefresh = true;
                                this.ApplySkiny();
                            }
                            break;
                    }
                }
            }
            try {
                this.myChoices.showDropdown();
            }
            catch (e) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", this.ControlText + ":ShowComboPicker", e);
            }
        }

        ComboSelect(pEle: HTMLSelectElement) {
            this.ComboUpdateValue(pEle.value);
        }

        ComboUpdateValue(pValue: string, DoRemove?: boolean): boolean {
            if (pValue === "CDE_PPP") {
                this.SetProperty("LiveOptions", null);
                this.ShowComboPicker();
            }
            else if (pValue === "CDE_LLL") {
                this.NeedRefresh = true;
                if (cdeNMI.MyEngine)
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:' + this.MyTableName + ':CMyTable:' + this.MyTableName + ':' + this.MyScreenID + ":false:true", '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
            }
            else {
                if (cde.CBool(this.GetProperty("AllowMultiSelect"))) {
                    const allVal: Array<string> = this.myChoices.getValue(true);
                    if (!DoRemove)
                        allVal.push(pValue);
                    pValue = allVal.join(this.MySep);
                    if (pValue.length === 0)
                        pValue = null;
                } else if (DoRemove === true) {
                    pValue = null;
                }
                const tOldVal = this.GetProperty("Value");
                if (tOldVal !== pValue) {
                    //if (cde.CBool(this.GetProperty("AllowMultiSelect")) && tOldVal) {
                    //    const tC = tOldVal.split(this.MySep);
                    //    if (tC.length > 0 && tC.filter(e => e === pValue).length>0) {
                    //        return;
                    //    }
                    //}
                    //else
                    this.SetProperty("Value", pValue);
                    return true;
                }
            }
            return false;
        }
    }
}