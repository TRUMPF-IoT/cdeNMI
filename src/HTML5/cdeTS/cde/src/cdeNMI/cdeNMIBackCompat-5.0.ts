// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

namespace cdeNMI {
    //Required for Backwards Compat with Convenience Apps
    export class TheMainPage {
        public static SetHoloLens(): string {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.SetHoloLens();
            return "";
        }
        public static GotoStationHome(IsManual: boolean) {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.GotoStationHome(IsManual);
        }
        public static ClearAndGoHome() {
            if (cdeNMI.MyScreenManager)
                cdeNMI.MyScreenManager.ClearAndGoHome();
        }
        public static GetDeepLink(): string {
            if (cdeNMI.MyScreenManager)
                return cdeNMI.MyScreenManager.GetDeepLink();
            return "";
        }

        public static TransitToScreen(pID: string, pMust?: boolean, bDontTry?: boolean) {
            if (cdeNMI.MyScreenManager)
                return cdeNMI.MyScreenManager.TransitToScreen(pID, pMust, bDontTry);
        }
    }

    export function FireEvent(FireAsync: boolean, pEventName: string, ...params): void {
        cde.MyBaseAssets.FireEvent(FireAsync, pEventName, ...params);
    }
    export function RegisterEvent(pEventName: string, pCallback): void {
        cde.MyBaseAssets.RegisterEvent(pEventName, (sender, ...param) => { pCallback(...param); });
    }
    export function AddCSSToHeader(pCSSFile: string, pCSSFileLite?: string) {
        cde.AddCSSToHeader(pCSSFile, pCSSFileLite);
    }
}

namespace cdeCommonUtils {
    export function FixupPath(pInPath: string): string {
        return cde.FixupPath(pInPath);
    }

    export function DateToString(inDate: Date): string {
        return cde.DateToString(inDate);
    }

    export function IsNotSet(pInVal) {
        return cde.IsNotSet(pInVal);
    }

    export function CStr(pInVal): string {
        return cde.CStr(pInVal);
    }

    export function CInt(pInVal): number {
        return cde.CInt(pInVal);
    }

    export function CBool(inStr): boolean {
        return cde.CBool(inStr);
    }

    export function CDbl(pInVal): number {
        return cde.CDbl(pInVal);
    }

    export function GuidToString(InGuid: string): string {
        return cde.GuidToString(InGuid);
    }

    export function cdeLogEvent(e) {
        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY","BackCompat:cdeLogEvent", e);
    }

    export function cdeMinMax(pValue: number, sourceMax: number, sourceMin: number, targetMax: number, targetMin: number): number {
        return cdeNMI.cdeMinMax(pValue, sourceMax, sourceMin, targetMax, targetMin);
    }

    export function toRadians(degrees) {
        return cdeNMI.toRadians(degrees);
    };
}
