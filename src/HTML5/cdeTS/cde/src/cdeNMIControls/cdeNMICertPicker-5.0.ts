// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class ctrlCertPicker extends cdeNMI.ctrlPropertyPicker implements INMIComboBox {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.CertPicker;
            this.ControlText = "ctrlCertPicker";
            this.RefreshCombo = '[{"V":"CDE_NOP","N":"click to see certificate-thumb and list"}]';
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            return true;
        }

        LoadComboContent(bForceShow: boolean) {
            const tChoiceOptions = this.GetProperty("LiveOptions");
            if (!tChoiceOptions) {
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:CERTPICKER:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID"), '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                    if (bForceShow)
                        this.UpdatePicker(bForceShow);
                }
                else {
                    this.DoShow = bForceShow;
                    this.SetProperty("LiveOptions", '[{"V":"CDE_NOP","N":"No NMI Engine available - cannot load"}]');
                }
            }
            else {
                this.CreateComboOptions(tChoiceOptions, this.GetProperty("Value"), true);
                this.UpdatePicker(bForceShow);
            }
            this.DoShow = false;
        }
    }
}