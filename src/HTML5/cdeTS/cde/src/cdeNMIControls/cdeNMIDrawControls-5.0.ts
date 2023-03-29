// SPDX-FileCopyrightText: 2009-2023 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    declare const jdenticon;    ///identIcon Dependency
    /**
         * Creates a new Drawing Canvas (HTML5 Canvas Element)
          *ctrlCanvasDraw is the base OBject for other controls:
          * 34: BarChart
          * 33: Slider
          * 38: DrawOverlay
          * This control is NOT and input control for Form or Table
         * (4.1 Ready!)
         */
     export class ctrlCanvasDraw extends TheNMIBaseControl {
         constructor(pTRF?: TheTRF) {
             super(null, pTRF);
         }

         bgcanvas: HTMLCanvasElement = null;
         fgcanvas: HTMLCanvasElement = null;
         bgctx: CanvasRenderingContext2D = null;
         fgctx: CanvasRenderingContext2D = null;
         redrawPending = false;
         foregroundPolylines: TheDrawingObject[] = new Array<TheDrawingObject>();
         mBaseDiv: HTMLDivElement = null;

         public WidthRatio = 1;
         public HeightRatio = 1;

         public MyWidth = 0;
         public MyHeight = 0;

         private MyBackDrawObjects: TheDrawingObject[];

         tObjPointer = -1;
         tStrokePointer = 0;
         tAsyncStrokes: TheDrawingObject[] = null;
         MyFirstPoint: TheDrawingPoint = null;

         public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
             this.MyBaseType = cdeControlType.CanvasDraw;
             super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

             let tBase: HTMLElement = null;
             if (this.MyTarget)
                 this.mBaseDiv = this.MyTarget.GetContainerElement() as HTMLDivElement;
             else {
                 this.mBaseDiv = document.createElement("div");
                 tBase = this.mBaseDiv;
             }

             if (!this.DoesSupportsCanvas) {
                 const nocanvas = document.createElement("div");
                 nocanvas.style.position = "absolute";
                 nocanvas.appendChild(document.createTextNode("Canvas drawing is not supported for your browser."));
                 this.mBaseDiv.appendChild(nocanvas);
                 return false;
             }

             if (!cde.CBool(this.GetSetting("NoBackBuffer"))) {
                 this.bgcanvas = document.createElement("canvas");
                 this.bgcanvas.width = 0;
                 this.bgcanvas.height = 0;
                 this.bgctx = this.bgcanvas.getContext("2d");
                 if (!tBase)
                     this.bgcanvas.style.position = "relative";
                 this.bgcanvas.style.top = "0px";
                 this.bgcanvas.style.left = "0px";
                 this.mBaseDiv.appendChild(this.bgcanvas);
             }

             this.fgcanvas = document.createElement("canvas");
             this.fgctx = this.fgcanvas.getContext("2d");
             this.fgcanvas.width = 0;
             this.fgcanvas.height = 0;
             if (!cde.CBool(this.GetSetting("IsInTable")))
                 this.fgcanvas.style.position = "absolute";
             this.fgcanvas.style.top = "0px";
             this.fgcanvas.style.left = "0px";

             this.SetProperty("Foreground", "#000000");

             this.mBaseDiv.appendChild(this.fgcanvas);
             this.PreventManipulation = true;
             this.SetElement(tBase ? tBase : this.fgcanvas);

             return true;
         }



         public SetProperty(pName: string, pValue) {
             let bDrawCanvas = false;
             let tShape: TheDrawingObject = null;
             let bHasPW = cde.CInt(this.GetProperty("PixelWidth")) > 0;
             let bHasPH = cde.CInt(this.GetProperty("PixelHeight")) > 0
             if (pName === "DataContextSilent") {
                 super.SetProperty("DataContext", pValue);
             }
             else {
                 if (pName === "Style") {
                     if (this.bgcanvas)
                         this.bgcanvas.style.cssText += pValue;
                     if (this.fgcanvas)
                         this.fgcanvas.style.cssText += pValue;
                 }
                 else {
                     if ((pName === "Value" || pName === "iValue") && pValue) {
                         const tV: string = pValue.toString();
                         if (tV.substring(0, 3) === "SH:") {
                             this.SetProperty("SetShapes", tV.substring(3));
                             return;
                         }
                     }
                     super.SetProperty(pName, pValue);
                 }
             }

             if (pName === "OnPointerDown") {
                 if (pValue) {
                     this.PreventDefault = true;
                     this.HookEvents(false);
                 }
                 this.RegisterEvent("PointerDown", pValue);
             } else if (pName === "OnPointerMove") {
                 if (pValue) {
                     this.PreventDefault = true;
                     this.HookEvents(false);
                 }
                 this.RegisterEvent("PointerMove", pValue);
             } else if (pName === "OnPointerUp") {
                 if (pValue) {
                     this.PreventDefault = true;
                     this.HookEvents(false);
                 }
                 this.RegisterEvent("PointerUp", pValue);
             } else if (pName === "OnPointerCancel") {
                 if (pValue) {
                     this.PreventDefault = true;
                     this.HookEvents(false);
                 }
                 this.RegisterEvent("PointerCancel", pValue);
             } else if (pName === "OnKeyDown") {
                 if (pValue) {
                     this.PreventDefault = true;
                     this.HookEvents(false);
                 }
                 this.RegisterEvent("KeyDown", pValue);
             } else if (pName === "OnKeyUp") {
                 if (pValue) {
                     this.PreventDefault = true;
                     this.HookEvents(false);
                 }
                 this.RegisterEvent("KeyUp", pValue);
             } else if (pName === "IsVertical") {
                 if (typeof pValue === "undefined" || cde.CBool(pValue)) {
                     pValue = true;
                     super.SetProperty("IsVertical", pValue);
                 }
                 this.DrawCanvasBackground();
             } else if (pName === "IsInverted") {
                 if (typeof pValue === "undefined" || cde.CBool(pValue)) {
                     pValue = true;
                     super.SetProperty("IsInverted", pValue);
                 }
                 this.DrawCanvasBackground();
             } else if (pName === "Background") {
                 this.DrawCanvasBackground();
             } else if (pName === "AddShape") {
                 try {
                     tShape = JSON.parse(pValue);
                     if (tShape) {
                         this.AddDrawingObject(tShape);
                         bDrawCanvas = true;
                     }
                 } catch (error) {
                     cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:ctrlCanvasDraw", "DrawCanvas-AddShape :" + error);
                 }
             } else if ((pName === "DrawShapes" || pName === "SetShapes") && pValue) {
                 try {
                     if (pName === "SetShapes")
                         this.ClearPicture();
                     const tShapes: TheDrawingObject[] = JSON.parse(pValue);
                     for (let i = 0; i < tShapes.length; i++) {
                         this.AddDrawingObject(tShapes[i], tShapes[i].ID + i.toString(), i < tShapes.length - 1);
                     }
                     bDrawCanvas = true;
                 } catch (error) {
                     cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:ctrlCanvasDraw", "DrawCanvas-DrawShapes :" + error);
                 }
             } else if (pName === "DrawShape" && pValue) {
                 try {
                     tShape = JSON.parse(pValue);
                     if (tShape) {
                         this.AddDrawingObject(tShape, tShape.ID);
                         bDrawCanvas = true;
                     }
                 } catch (error) {
                     cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:ctrlCanvasDraw", "DrawCanvas-DrawShape :" + error);
                 }
             } else if (pName === "SetShape") {
                 if (pValue) {
                     this.ClearPicture();
                     try {
                         tShape = JSON.parse(pValue);
                         if (tShape) {
                             this.AddDrawingObject(tShape);
                             bDrawCanvas = true;
                         }
                     } catch (error) {
                         cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:ctrlCanvasDraw", "DrawCanvas-SetShape :" + error);
                     }
                 }
             } else if (pName === "TileFactorX") {
                 if (!bHasPW) {
                     const tFX = cde.CInt(pValue);
                     if (tFX > 1) {
                         pValue = cde.CInt(this.GetProperty("ControlTW"));
                         if (pValue === 0) pValue = 1;
                         pValue = cdeNMI.GetSizeFromTile(pValue);
                         this.SetProperty("AbsWidth", pValue / tFX);
                     }
                 }
             } else if (pName === "TileFactorY") {
                 if (!bHasPH) {
                     const tFX = cde.CInt(pValue);
                     if (tFX > 1) {
                         pValue = cde.CInt(this.GetProperty("ControlTH"));
                         if (pValue === 0) pValue = 1;
                         pValue = cdeNMI.GetSizeFromTile(pValue);
                         this.SetProperty("AbsHeight", pValue / tFX);
                     }
                 }
             } else if (pName === "DrawMargin") {
                 const tMarg: number = cde.CDbl(pValue);
                 const tHe: number = this.MyHeight - (tMarg * 2)
                 const tWi: number = this.MyWidth - (tMarg * 2)
                 if (this.bgcanvas) {
                     this.bgcanvas.style.top = tMarg.toString() + "px";
                     this.bgcanvas.style.left = tMarg.toString() + "px";
                     this.bgcanvas.style.height = tHe + "px";
                     this.bgcanvas.height = tHe;
                     this.bgcanvas.style.width = tWi + "px";
                     this.bgcanvas.width = tWi;
                 }
                 if (this.fgcanvas) {
                     this.fgcanvas.style.top = tMarg.toString() + "px";
                     this.fgcanvas.style.left = tMarg.toString() + "px";
                     this.fgcanvas.style.height = tHe + "px";
                     this.fgcanvas.height = tHe;
                     this.fgcanvas.style.width = tWi + "px";
                     this.fgcanvas.width = tWi;
                 }
             } else if (pName === "ControlTW") {
                 this.SetDrawWidth(pValue);
             } else if (pName === "ControlTH") {
                 this.SetDrawHeight(pValue);
             } else if (pName === "CanvasHeight") {
                 pValue = cde.CInt(pValue);
                 if (this.fgcanvas && this.fgcanvas.height !== pValue) {
                     this.fgcanvas.height = pValue;
                 }
                 if (this.bgcanvas && this.bgcanvas.height !== pValue) {
                     this.bgcanvas.height = pValue;
                 }
                 this.HeightRatio = cde.CDbl(pValue) / this.MyHeight;
                 bDrawCanvas = true;
             } else if (pName === "CanvasWidth") {
                 pValue = cde.CInt(pValue);
                 if (this.fgcanvas && this.fgcanvas.width !== pValue) {
                     this.fgcanvas.width = pValue;
                 }
                 if (this.bgcanvas && this.bgcanvas.width !== pValue) {
                     this.bgcanvas.width = pValue;
                 }
                 this.WidthRatio = pValue / this.MyWidth;
                 bDrawCanvas = true;
             } else if (pName === "AbsHeight" || pName === "PixelHeight") {
                 pValue = cde.CInt(pValue);
                 if (this.fgcanvas && this.fgcanvas.height !== pValue) {
                     this.fgcanvas.style.height = pValue + "px";
                     this.fgcanvas.height = pValue;
                 }
                 if (this.bgcanvas && this.bgcanvas.height !== pValue) {
                     this.bgcanvas.style.height = pValue + "px";
                     this.bgcanvas.height = pValue;
                 }
                 this.MyHeight = pValue;
                 this.HeightRatio = 1;
                 bDrawCanvas = true;
             } else if (pName === "AbsWidth" || pName === "PixelWidth") {
                 pValue = cde.CInt(pValue);
                 if (this.fgcanvas && this.fgcanvas.width !== pValue) {
                     this.fgcanvas.style.width = pValue + "px";
                     this.fgcanvas.width = pValue;
                 }
                 if (this.bgcanvas && this.bgcanvas.width !== pValue) {
                     this.bgcanvas.style.width = pValue + "px";
                     this.bgcanvas.width = pValue;
                 }
                 this.MyWidth = pValue;
                 this.WidthRatio = 1;
                 bDrawCanvas = true;
             } else if (pName === "YRatio" && this.fgcanvas) {
                 const tRat = cde.CDbl(this.fgcanvas.style.width.substring(0, this.fgcanvas.style.width.length - 2)) / cde.CDbl(pValue);
                 this.fgcanvas.style.height = tRat + "px";
                 this.MyHeight = tRat;
             }

             if (!bDrawCanvas && pName === "DataContextSilent")
                 bDrawCanvas = false;
             else
                 bDrawCanvas = true;

             if (bDrawCanvas) {
                 this.RequestRedraw();
             }
         }

         SetDrawWidth(pValue: number) {
             if (cde.CInt(this.GetProperty("PixelWidth")) == 0) {
                 let tFX = cde.CInt(this.GetProperty("TileFactorX"));
                 if (tFX === 0) tFX = 1;
                 pValue = cde.CInt(pValue);
                 if (pValue === 0) pValue = 1;
                 pValue = cdeNMI.GetSizeFromTile(pValue);
                 this.SetProperty("AbsWidth", pValue / tFX);
             }
         }

         SetDrawHeight(pValue: number) {
             if (cde.CInt(this.GetProperty("PixelHeight")) == 0) {
                 let tFX = cde.CInt(this.GetProperty("TileFactorY"));
                 if (tFX === 0) tFX = 1;
                 pValue = cde.CInt(pValue);
                 if (pValue === 0) pValue = 1;
                 pValue = cdeNMI.GetSizeFromTile(pValue);
                 this.SetProperty("AbsHeight", pValue / tFX);
             }
         }

        public ApplySkin() {
            this.ResizeCanvas();
        }

        public ResizeCanvas() {
            if (this.mBaseDiv.clientWidth === 0 || this.mBaseDiv.clientHeight === 0)
                return;
            if (cde.CBool(this.GetProperty("AutoAdjust")) || this.MyWidth === 0 || this.MyHeight === 0) {
                if (this.MyWidth !== this.mBaseDiv.clientWidth) {
                    this.MyWidth = this.mBaseDiv.clientWidth;
                    this.SetProperty("AbsWidth", this.MyWidth);
                }
                if (this.MyHeight !== this.mBaseDiv.clientHeight) {
                    this.MyHeight = this.mBaseDiv.clientHeight;
                    this.SetProperty("AbsHeight", this.MyHeight);
                }
            }
        }


        DoesSupportsCanvas() {
            return !!document.createElement('canvas').getContext;
        }

        public GetPNG(): string {
            if (!this.bgcanvas)
                return "";
            return this.bgcanvas.toDataURL("image/png");
        }

        public GetBGRenderContext(): CanvasRenderingContext2D {
            return this.bgcanvas.getContext('2d');
        }

        public AddDrawingObject(pObject: TheDrawingObject, id?, drawLater?: boolean) {
            let tDrawingObjects: TheDrawingObject[] = this.GetProperty("DataContext");
            if (!tDrawingObjects)
                tDrawingObjects = [];
            if (id)
                tDrawingObjects[id] = pObject;
            else
                tDrawingObjects[cdeNMI.MyNMISettings.IDCounter++] = pObject;
            this.SetProperty("DataContext", tDrawingObjects);
            if (!drawLater)
                this.RequestRedraw();
        }

        public DrawCanvasBackground() {
            if (!this.bgctx) return;
            if (this.bgctx.canvas.height === 0 || this.bgctx.canvas.width === 0)
                this.ResizeCanvas();
            this.bgctx.globalAlpha = 1;
            if (this.GetProperty("ForegroundOpacity"))
                this.fgctx.globalAlpha = parseFloat(this.GetProperty("ForegroundOpacity"));
            let tIsTrans = false;
            if (this.GetProperty("Background")) {
                this.bgctx.fillStyle = ctrlCanvasDraw.ProcessColor(this, this.bgctx, this.GetProperty("Background"));
                if (this.GetProperty("Background").toLowerCase() === "transparent")
                    tIsTrans = true;
            }
            else {
                this.bgctx.fillStyle = "transparent";
                tIsTrans = true;
            }
            if (tIsTrans)
                this.bgctx.clearRect(0, 0, this.bgctx.canvas.width, this.bgctx.canvas.height);
            else
                this.bgctx.fillRect(0, 0, this.bgctx.canvas.width, this.bgctx.canvas.height);

            if (this.GetProperty("Playback") === true) {
                this.tObjPointer = 0;
                this.tAsyncStrokes = this.MyBackDrawObjects;
                this.tStrokePointer = 0;
                this.DrawLinesAsync(this, this.bgctx);
            }
            else {
                for (const id in this.MyBackDrawObjects) {
                    if (this.MyBackDrawObjects[id].Visibility && this.MyBackDrawObjects[id].HasEnded) {
                        this.DrawObject(this.bgctx, this.MyBackDrawObjects[id]);
                    }
                }
            }
        }

        public ClearPicture() {
            this.MyBackDrawObjects = [];
            if (this.bgctx)
                this.bgctx.clearRect(0, 0, this.bgctx.canvas.width, this.bgctx.canvas.height);
            if (this.fgctx)
                this.fgctx.clearRect(0, 0, this.fgctx.canvas.width, this.fgctx.canvas.height);
            this.foregroundPolylines = [];
            this.DrawCanvasBackground();
            this.SetProperty("DataContext", null);
        }

        RedrawForeground() {
            this.redrawPending = false;
            if (!cde.CBool(this.GetProperty("Playback")) && !cde.CBool(this.GetProperty("NoClear")))
                this.fgctx.clearRect(0, 0, this.fgctx.canvas.width, this.fgctx.canvas.height);

            let tDrawingObjects: TheDrawingObject[] = this.GetProperty("DataContext");
            if (!tDrawingObjects)
                tDrawingObjects = [];
            let id;
            for (id in this.foregroundPolylines) {
                if (this.foregroundPolylines[id].HasEnded) {
                    tDrawingObjects.push(this.foregroundPolylines[id]);
                    delete this.foregroundPolylines[id.toString()];
                } else
                    this.DrawPolyline(this.fgctx, this.foregroundPolylines[id].ComplexData, this.foregroundPolylines[id].Foreground, this.foregroundPolylines[id].Fill);
            }

            if (tDrawingObjects.length > 0 && this.GetProperty("Playback") === true) {
                for (id in tDrawingObjects) {
                    if (!this.MyBackDrawObjects)
                        this.MyBackDrawObjects = [];
                    if (!tDrawingObjects[id].IsTemp)
                        this.MyBackDrawObjects.push(tDrawingObjects[id]);
                    delete tDrawingObjects[id];
                }
                this.DrawCanvasBackground();
            } else {
                for (id in tDrawingObjects) {
                    if (tDrawingObjects[id].Visibility) {
                        this.DrawObject(cde.CBool(tDrawingObjects[id].HasEnded) && this.bgctx ? this.bgctx : this.fgctx, tDrawingObjects[id]);
                    }
                    if (tDrawingObjects[id].HasEnded || tDrawingObjects[id].Type !== 2) {
                        if (!this.MyBackDrawObjects)
                            this.MyBackDrawObjects = [];
                        if (!tDrawingObjects[id].IsTemp)
                            this.MyBackDrawObjects.push(tDrawingObjects[id]);
                        delete tDrawingObjects[id];
                    }
                }
            }
            this.SetProperty("DataContextSilent", tDrawingObjects);
        }

        public DrawObject(pctx: CanvasRenderingContext2D, tDrawingObjects: TheDrawingObject) {
            switch (tDrawingObjects.Type) {
                case 1: //Rectangle
                    pctx.fillStyle = ctrlCanvasDraw.ProcessColor(this, pctx, tDrawingObjects.Fill);
                    pctx.fillRect(tDrawingObjects.Left, tDrawingObjects.Top, tDrawingObjects.Width, tDrawingObjects.Height);
                    break;
                case 2: //Polyline
                    this.DrawPolyline(tDrawingObjects.HasEnded && this.bgctx ? this.bgctx : pctx, tDrawingObjects.ComplexData, tDrawingObjects.Foreground, tDrawingObjects.Fill);
                    break;
                case 3: //Text
                    if (!tDrawingObjects.ComplexData) return;
                    if (tDrawingObjects.ComplexData.Font)
                        pctx.font = tDrawingObjects.ComplexData.Font;
                    pctx.strokeStyle = ctrlCanvasDraw.ProcessColor(this, pctx, tDrawingObjects.Fill);
                    pctx.strokeText(tDrawingObjects.ComplexData.Text, tDrawingObjects.Left, tDrawingObjects.Top);
                    break;
                case 4: //Filled Cicrle
                    pctx.beginPath();
                    pctx.arc(tDrawingObjects.Left, tDrawingObjects.Top, tDrawingObjects.Width, 0, 2 * Math.PI, false);
                    pctx.fillStyle = ctrlCanvasDraw.ProcessColor(this, pctx, tDrawingObjects.Fill);
                    pctx.fill();
                    break;
                case 5: //Empty Circle
                    pctx.beginPath();
                    pctx.arc(tDrawingObjects.Left, tDrawingObjects.Top, tDrawingObjects.Width, 0, 2 * Math.PI, false);
                    pctx.lineWidth = tDrawingObjects.StrokeThickness;
                    pctx.strokeStyle = ctrlCanvasDraw.ProcessColor(this, pctx, tDrawingObjects.Fill);
                    pctx.stroke();
                    break;
                case 6: //Image Draw
                    {
                        const tIMG: HTMLImageElement = document.createElement("img");
                        tIMG.src = "data:image/jpeg;base64," + tDrawingObjects.ComplexData;
                        pctx.drawImage(tIMG, tDrawingObjects.Left, tDrawingObjects.Top);
                    }
                    break;
                case 7: //drawIcon
                    try {
                        if (jdenticon) {
                            pctx.setTransform(1, 0, 0, 1, tDrawingObjects.Left, tDrawingObjects.Top);
                            jdenticon.drawIcon(pctx, tDrawingObjects.ComplexData, tDrawingObjects.Width);
                        }
                    }
                    catch {
                        //ignored
                    }
                    break;

            }
        }

        public RequestRedraw() {
            if (!this.redrawPending) {
                this.redrawPending = true;

                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(() => {
                        this.RedrawForeground();
                    });
                }
                else {
                    //if (window.webkitRequestAnimationFrame)
                    //    window.webkitRequestAnimationFrame(() => {
                    //        this.RedrawForeground();
                    //    });
                    //else
                        window.setTimeout(() => {
                            this.RedrawForeground();
                        }, Math.floor(1000 / 60));
                }
            }
        }

        DrawPolyline(ctx: CanvasRenderingContext2D, pPoints: TheStrokePoint[], pColor?: string, pFillColor?: string) {
            if (pPoints.length === 1) {
                ctx.beginPath();
                ctx.arc(pPoints[0].PO.x, pPoints[0].PO.y, 10, 0, Math.PI, true);
                ctx.arc(pPoints[0].PO.x, pPoints[0].PO.y, 10, Math.PI, Math.PI * 2, true);
                if (pColor)
                    ctx.fillStyle = pColor;
                ctx.globalAlpha = 0.5;
                ctx.fill();
            }
            else if (pPoints.length > 1) {

                for (let i = 1; i < pPoints.length; ++i) {
                    ctx.beginPath();
                    ctx.moveTo(pPoints[i - 1].PO.x, pPoints[i - 1].PO.y);
                    ctx.lineCap = "round";
                    ctx.strokeStyle = pColor;
                    ctx.globalAlpha = 1;
                    ctx.lineTo(pPoints[i].PO.x, pPoints[i].PO.y);
                    let pStrokeThickness: number = pPoints[i].PO.t;
                    if (pStrokeThickness < 1) pStrokeThickness = 1;
                    ctx.lineWidth = pStrokeThickness * cdeNMI.MyNMISettings.StrokeSize;
                    ctx.stroke();
                }

                if (pFillColor) {
                    ctx.fillStyle = pFillColor;
                    ctx.globalAlpha = 0.3;
                    ctx.fill();
                }
            }
        }


        DrawLinesAsync(thisObj: ctrlCanvasDraw, ctx: CanvasRenderingContext2D) {
            if (!thisObj.tAsyncStrokes || thisObj.tObjPointer < 0 || thisObj.tAsyncStrokes.length <= thisObj.tObjPointer) return;
            let tStrokeP = thisObj.tAsyncStrokes[thisObj.tObjPointer].ComplexData;
            thisObj.tStrokePointer++;
            if (thisObj.tStrokePointer >= tStrokeP.length) {
                if (thisObj.tAsyncStrokes[thisObj.tObjPointer].Fill) {
                    ctx.fillStyle = thisObj.tAsyncStrokes[thisObj.tObjPointer].Fill;
                    ctx.globalAlpha = 0.3;
                    ctx.fill();
                }
                thisObj.tObjPointer++;
                if (thisObj.tObjPointer < thisObj.tAsyncStrokes.length) {
                    tStrokeP = thisObj.tAsyncStrokes[thisObj.tObjPointer].ComplexData;
                    thisObj.tStrokePointer = 1;
                }
                else {
                    thisObj.tObjPointer = -1;
                    thisObj.tStrokePointer = -1;
                    thisObj.SetProperty("Playback", false);
                    return;
                }
            }
            ctx.beginPath();
            ctx.moveTo(tStrokeP[thisObj.tStrokePointer - 1].PO.x, tStrokeP[thisObj.tStrokePointer - 1].PO.y);
            ctx.lineCap = "round";
            ctx.strokeStyle = thisObj.tAsyncStrokes[thisObj.tObjPointer].Foreground;
            ctx.globalAlpha = 1;
            ctx.lineTo(tStrokeP[thisObj.tStrokePointer].PO.x, tStrokeP[thisObj.tStrokePointer].PO.y);
            let pStrokeThickness: number = tStrokeP[thisObj.tStrokePointer].PO.t;
            if (pStrokeThickness < 1) pStrokeThickness = 1;
            ctx.lineWidth = pStrokeThickness * cdeNMI.MyNMISettings.StrokeSize;
            ctx.stroke();
            let tDelay: number = tStrokeP[thisObj.tStrokePointer].DT - tStrokeP[thisObj.tStrokePointer - 1].DT;
            if (thisObj.tStrokePointer < 2)
                tDelay = tStrokeP[1].DT;
            setTimeout(thisObj.DrawLinesAsync, tDelay, thisObj, ctx);
        }

         BeginPolyline(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
             if (cde.CBool(pTarget.GetProperty("IsDisabled")) === true)
                 return;
            const tCanvDraw: ctrlCanvasDraw = pTarget as ctrlCanvasDraw;
            if (tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()])
                tCanvDraw.EndPolyline(pTarget, pEvent, pPointer);

            let tColor: string = pTarget.GetProperty("Foreground");
            if (pTarget.GetProperty("UseRandomColor") === true)
                tColor = cdeNMI.CColorToHex('rgb(' + Math.floor(Math.random() * 180) + ',' + Math.floor(Math.random() * 180) + ',' + Math.floor(Math.random() * 180) + ')'); //NOSONAR not crypto related
            const tSt: TheStrokePoint = new TheStrokePoint();
            tSt.DT = Math.ceil((new Date()).getTime() - (new Date(2014, 4, 1)).getTime());
            tSt.PG = pPointer.Identifier.toString();
            tSt.PO = pPointer.AdjPosition;
            tCanvDraw.MyFirstPoint = new TheDrawingPoint(pPointer.Position.x, pPointer.Position.y);
            tCanvDraw.MyFirstPoint.t = pPointer.Buttons;
            tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()] = {
                Type: 2,
                Visibility: true,
                ComplexData: [tSt],
                Foreground: tColor
            };
            tCanvDraw.RequestRedraw();
        }

        ExtendPolylineTo(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            const tCanvDraw: ctrlCanvasDraw = pTarget as ctrlCanvasDraw;
            if (tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()]) {
                const polyline: TheDrawingObject = tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()];
                const p0: TheStrokePoint = polyline.ComplexData[0] as TheStrokePoint;
                const tSt: TheStrokePoint = new TheStrokePoint();
                tSt.DT = Math.ceil((new Date()).getTime() - (new Date(2014, 4, 1)).getTime()) - p0.DT;
                tSt.PG = pPointer.Identifier.toString();
                tSt.PO = pPointer.AdjPosition;
                tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()].ComplexData.push(tSt);
            }
            tCanvDraw.RequestRedraw();
        }

        EndPolyline(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            const tCanvDraw: ctrlCanvasDraw = pTarget as ctrlCanvasDraw;
            if (tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()]) {
                const polyline: TheDrawingObject = tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()];
                const p0: TheStrokePoint = polyline.ComplexData[0] as TheStrokePoint;
                const tSt: TheStrokePoint = new TheStrokePoint();
                tSt.DT = Math.ceil((new Date()).getTime() - (new Date(2014, 4, 1)).getTime()) - p0.DT;
                tSt.PG = pPointer.Identifier.toString();
                tSt.PO = pPointer.AdjPosition;
                tCanvDraw.foregroundPolylines[pPointer.Identifier.toString()].ComplexData.push(tSt);
                if (polyline) {
                    const distance: number = cdeNMI.Vector2Distance(p0.PO, tSt.PO);
                    if (tCanvDraw.GetProperty("FillDistance") && distance < tCanvDraw.GetProperty("FillDistance")) {
                        polyline.Fill = polyline.Foreground;
                    }
                    polyline.HasEnded = true;
                    tCanvDraw.RequestRedraw();
                    tCanvDraw.FireEvent(false, "OnDrawEnd", pPointer, polyline);
                    const tTargetCtrl = cdeNMI.GetControlFromPoint(tCanvDraw.MyFirstPoint.x, tCanvDraw.MyFirstPoint.y);
                    if (tTargetCtrl) {
                        if (tCanvDraw.MyFirstPoint.t > 1 && distance < 5) {
                            tTargetCtrl.FireEvent(true, "NMI_SHAPE_RECOGNIZED", "rightmouse", 10);
                        } else if (cdeNMI.MyShapeRecognizer && cde.CBool(pTarget.GetProperty("EnableRecognizer"))) {
                            const tRes: TheRecognizerResult = cdeNMI.MyShapeRecognizer.RecogizeShape(polyline, 0);
                            if (tRes)
                                tTargetCtrl.FireEvent(true, "NMI_SHAPE_RECOGNIZED", tRes.Name, tRes.Score);
                        }
                    }
                }
            }
        }

        public static ProcessColor(pThis: INMIControl, pgbctx: CanvasRenderingContext2D, tFill: string) {
            const tCmd: string = tFill.substring(0, 3);
            switch (tCmd) {
                case "SVG": //Syntax: "SVG:<svgCode>"
                    {
                        const data = tFill.substring(4);
                        const DOMURL: any = self.URL || self.webkitURL || self;
                        const svg = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
                        const url = DOMURL.createObjectURL(svg);
                        const img = new Image();
                        img.crossOrigin = 'Anonymous';
                        img.src = url;// data
                        pgbctx.drawImage(img, 100, 100);
                    }
                    return "transparent";
                case "HUE":
                    {
                        let gradient: CanvasGradient = null;
                        if (pThis.GetProperty("IsVertical"))
                            gradient = pgbctx.createLinearGradient(0, 0, 0, pgbctx.canvas.height);
                        else
                            gradient = pgbctx.createLinearGradient(0, 0, pgbctx.canvas.width, 0);
                        if (pThis.GetProperty("IsInverted")) {
                            gradient.addColorStop(0, "#FF0000");
                            gradient.addColorStop(0.17, "#FF00FF");
                            gradient.addColorStop(0.33, "#0000FF");
                            gradient.addColorStop(0.50, "#00FFFF");
                            gradient.addColorStop(0.67, "#00FF00");
                            gradient.addColorStop(0.83, "#FFFF00");
                            gradient.addColorStop(1, "#FF0000");
                        }
                        else {
                            gradient.addColorStop(0, "#FF0000");
                            gradient.addColorStop(0.17, "#FFFF00");
                            gradient.addColorStop(0.33, "#00FF00");
                            gradient.addColorStop(0.50, "#00FFFF");
                            gradient.addColorStop(0.67, "#0000FF");
                            gradient.addColorStop(0.83, "#FF00FF");
                            gradient.addColorStop(1, "#FF0000");
                        }
                        return gradient;
                    }
                default:
                    {
                        let tBar: string[];
                        if (tFill.length > 9 && tFill.toLowerCase().substring(0, 9) === "gradient(") {
                            tBar = tFill.substr(9, tFill.length - 10).split(',');
                            let tMode = 1;
                            if (pThis.GetProperty("IsVertical")) tMode = 2;
                            return ctrlCanvasDraw.CreateGradient(pgbctx, tBar, tMode, cde.CBool(pThis.GetProperty("IsInverted")));
                        } else if (tFill.length > 10 && tFill.toLowerCase().substring(0, 10) === "gradientc(") {
                            tBar = tFill.substr(10, tFill.length - 11).split(',');
                            return ctrlCanvasDraw.CreateGradient(pgbctx, tBar, 0, cde.CBool(pThis.GetProperty("IsInverted")));
                        } else if (tFill.toLowerCase() === "transparent")
                            tFill = "rgba(0,0,0,0)";
                    }
                    break;
            }
            return tFill;
        }

        public static CreateGradient(pgbctx: CanvasRenderingContext2D, tBar: string[], pMode: number, bInverted: boolean): CanvasGradient {
            let gradient: CanvasGradient;
            switch (pMode) {
                case 1:
                    gradient = pgbctx.createLinearGradient(0, 0, pgbctx.canvas.width, 0);
                    break;
                case 2:
                    gradient = pgbctx.createLinearGradient(0, 0, 0, pgbctx.canvas.height);
                    break;
                default:
                    gradient = pgbctx.createRadialGradient(pgbctx.canvas.width / 2, pgbctx.canvas.height / 2, 1, pgbctx.canvas.width / 2, pgbctx.canvas.height / 2, pgbctx.canvas.height / 2);
                    break;
            }
            let i: number;
            if (bInverted) {
                for (i = 0; i < tBar.length; i++) {
                    gradient.addColorStop(i, tBar[i]);
                }
            }
            else {
                for (i = 0; i < tBar.length; i++) {
                    gradient.addColorStop(i, tBar[(tBar.length - 1) - i]);
                }
            }
            return gradient;
        }
    }



    /**
    * Creates a Canvas with Touch and Pen sensitve area
    *
    * (4.1 Ready!)
    */
    export class ctrlTouchDraw extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        drawingTarget: INMIControl = null;  // target of the actual drawing
        mBaseDiv: INMIControl = null;
        mTextFld: INMIControl = null;

        mStrokes: TheDrawingObject[] = new Array<TheDrawingObject>();
        mIsTextFldVisible = false;
        mIsSynced = false;

        public MyDrawingObject: INMICanvasDraw; // a canvas, drawing object; may be undefined

        mTextToggleButton: INMIControl = null;
        mSaveButton: INMIControl = null;
        mClearButton: INMIControl = null;
        mPlayButton: INMIControl = null;

        tBlack: cdeNMI.INMIControl = null;
        tRed: cdeNMI.INMIControl = null;
        tGreen: cdeNMI.INMIControl = null;
        tYellow: cdeNMI.INMIControl = null;
        tBlue: cdeNMI.INMIControl = null;
        tPink: cdeNMI.INMIControl = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.TouchDraw;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            if (this.MyFieldInfo) {
                this.mIsSynced = cde.CBool(this.GetSetting("IsSynced"));
            }

            this.mBaseDiv = cdeNMI.MyTCF.CreateBaseControl().Create(pTargetControl, { TRF: this.MyTRF });
            this.mBaseDiv.SetElement(document.createElement("div") as HTMLElement);
            this.mBaseDiv.SetInitialSize(1);

            this.drawingTarget = cdeNMI.MyTCF.CreateBaseControl().Create(this.mBaseDiv);
            this.drawingTarget.SetElement(document.createElement("div"));
            this.drawingTarget.GetElement().style.cursor = "default";
            this.drawingTarget.GetElement().style.width = "inherit";
            this.drawingTarget.GetElement().style.height = "inherit";
            this.mBaseDiv.AppendChild(this.drawingTarget);

            const holder = this.mBaseDiv.GetElement();
            holder.ondragover = () => {
                this.drawingTarget.GetElement().style.borderLeftWidth = "5px";
                this.drawingTarget.GetElement().style.borderLeftColor = "red";
                return false;
            };
            holder.ondragend = () => {
                this.drawingTarget.GetElement().style.borderLeftWidth = "0px";
                return false;
            };
            holder.ondragleave = () => {
                this.drawingTarget.GetElement().style.borderLeftWidth = "0px";
                return false;
            };
            holder.ondrop = (e: DragEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.drawingTarget.GetElement().style.borderLeftWidth = "0px";
                this.ProcessFiles(e.dataTransfer.files);
            }

            this.MyDrawingObject = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.CanvasDraw).Create(this.drawingTarget, { TRF: pTRF }) as INMICanvasDraw;
            this.MyDrawingObject.SetProperty("FillDistance", 25);
            if (!this.MyDrawingObject.MyFormID)
                this.MyDrawingObject.MyFormID = this.MyFormID;

            if (!this.MyFieldInfo || !this.MyFieldInfo.Flags || (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) !== 0)) {
                this.MyDrawingObject.SetProperty("OnPointerDown", this.MyDrawingObject.BeginPolyline);
                this.MyDrawingObject.SetProperty("OnPointerMove", this.MyDrawingObject.ExtendPolylineTo);
                this.MyDrawingObject.SetProperty("OnPointerUp", this.MyDrawingObject.EndPolyline);
                this.MyDrawingObject.SetProperty("OnPointerCancel", this.MyDrawingObject.EndPolyline);

                this.MyDrawingObject.RegisterEvent("OnDrawEnd", (thisObj: cdeNMI.INMIControl, pPointer: cdeNMI.ThePointer, polyline: TheDrawingObject) => {
                    const pPointerID: number = pPointer.Identifier;
                    this.mStrokes.push(polyline);
                    this.SetProperty("Value", JSON.stringify(this.mStrokes));

                    if (this.mIsSynced && this.MyTRF && cdeNMI.MyEngine) {
                        cdeNMI.MyEngine.GetBaseEngine().PublishCentral("NEWDRAWOBJECT:" + this.MyTRF.GetHash() + ":REMOTE_" + pPointerID, JSON.stringify(polyline));
                    }
                });

                if (this.mIsSynced)
                    this.RegisterSyncEvents();

                let tButLoc = 0;
                this.mClearButton = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Clear", "Style=position:absolute; right:0px;background-color:white; background-image:none; top:0px"] }); //TODO: Convert Style to ClassName!
                this.mClearButton.SetProperty("OnClick", () => {
                    this.ClearPicture();
                    this.SetProperty("Value", "");
                    this.FireEvent(false, "OnClearPicture");
                    if (this.mIsSynced && this.MyTRF && cdeNMI.MyEngine)
                        cdeNMI.MyEngine.GetBaseEngine().PublishCentral("CLEARCANVAS:" + this.MyTRF.GetHash());
                    return false;
                });
                this.mClearButton.SetProperty("TileTop", tButLoc++);
                this.mClearButton.SetProperty("Foreground", "black");
                if (cde.CBool(this.GetSetting("HideClear")))
                    this.mClearButton.SetProperty("Visibility", false);

                this.mSaveButton = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Save", "Style=position:absolute; right:0px;background-color:white; background-image:none;"] }); 
                this.mSaveButton.SetProperty("OnClick", (sender: INMIControl, e: PointerEvent, tPs: number) => {
                    let imageData: string;
                    let fileExt = ".PNG";
                    if (e.button === 2 || tPs > 1 || (this.GetProperty("FileFormat") && this.GetProperty("FileFormat").toString().length > 0)) {
                        imageData = JSON.stringify(this.mStrokes);
                        let tExt: string = this.GetProperty("FileFormat");
                        if (!tExt)
                            tExt = "ink2me";
                        fileExt = "." + tExt;
                        if (cde.MyContentEngine)
                            cde.MyContentEngine.SaveFile(imageData, cdeNMI.DateToMini(new Date()) + fileExt, "image/png", false);
                    }
                    else {
                        imageData = this.MyDrawingObject.GetPNG();
                        const tRaw = cdeNMI.convertBase64ToBinary(imageData);
                        if (cde.MyContentEngine)
                            cde.MyContentEngine.SaveFile(tRaw, cdeNMI.DateToMini(new Date()) + fileExt, "image/png", false);
                    }
                    this.FireEvent(false, "OnSavePicture", imageData);
                    if (this.mIsSynced && imageData.length > 1) {
                        cdeNMI.ShowToastMessage("Drawing sent to owner");
                        if (cde.MyContentEngine) {
                            if (this.MyFieldInfo)
                                cde.MyContentEngine.PublishToNode(this.MyFieldInfo.cdeN, "CDE_FILEPUSH:IMG" + cdeNMI.DateToMini(new Date()) + fileExt, imageData);
                            else
                                cde.MyContentEngine.PublishToService("CDE_FILEPUSH:IMG" + cdeNMI.DateToMini(new Date()) + fileExt, imageData);
                        }
                    }
                    return false;
                });
                this.mSaveButton.SetProperty("TileTop", tButLoc++);
                this.mSaveButton.SetProperty("Foreground", "black");
                this.mSaveButton.SetProperty("Visibility", this.mIsSynced);

                this.mPlayButton = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Play", "Style=position:absolute; right:0px;background-color:white; background-image:none;"] }); 
                this.mPlayButton.SetProperty("OnClick", () => { //sender: INMIControl, e: PointerEvent, tPs: number
                    this.MyDrawingObject.SetProperty("Playback", true);
                    this.MyDrawingObject.DrawCanvasBackground();
                    if (this.mIsSynced && this.MyTRF && cdeNMI.MyEngine)
                        cdeNMI.MyEngine.GetBaseEngine().PublishCentral("PLAYBOARD:" + this.MyTRF.GetHash());
                    return false;
                });
                this.mPlayButton.SetProperty("TileTop", tButLoc++);
                this.mPlayButton.SetProperty("Foreground", "black");
                if (!cde.CBool(this.GetSetting("ShowPlay")))
                    this.mPlayButton.SetProperty("Visibility", false);

                if ((this.MyFieldInfo && (this.MyFieldInfo.Flags & 32) !== 0) || (this.GetProperty("Value") && this.GetProperty("Value").substring(0, 2) !== "[{")) {
                    this.ShowTextField(this.GetProperty("Value"), false);
                    this.mTextToggleButton = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.mBaseDiv, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Enter Text", "Style=position:absolute; right:0px"] }); 
                    this.mTextToggleButton.SetProperty("OnClick", () => {
                        if (this.mIsTextFldVisible) {
                            this.mIsTextFldVisible = false;
                            this.drawingTarget.SetProperty("Visibility", true);
                            this.mTextFld.SetProperty("Visibility", false);
                            this.mTextToggleButton.SetProperty("Text", "Enter Text");
                            this.mSaveButton.SetProperty("Disabled", false);
                        }
                        else {
                            this.mIsTextFldVisible = true;
                            this.drawingTarget.SetProperty("Visibility", false);
                            this.mTextFld.SetProperty("Visibility", true);
                            this.mTextToggleButton.SetProperty("Text", "Draw");
                            this.mSaveButton.SetProperty("Disabled", true);
                        }
                        return false;
                    });
                    this.mTextToggleButton.SetProperty("TileTop", 2);
                    this.mTextToggleButton.SetProperty("Foreground", "black");
                } else {
                    this.tBlack = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Black", "Style=position:absolute; right:0px; background-color:black; background-image:none;"] }); 
                    this.tBlack.SetProperty("OnClick", () => {
                        this.MyDrawingObject.SetProperty("Foreground", "#000000");
                        return false;
                    });
                    this.tBlack.SetProperty("TileTop", tButLoc++);
                    if (!cde.CBool(this.GetSetting["ShowColors"]))
                        this.tBlack.SetProperty("Visibility", false);

                    this.tRed = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Red", "Style=position:absolute; right:0px; background-color:#FF0000; background-image:none;"] }); 
                    this.tRed.SetProperty("OnClick", () => {
                        this.MyDrawingObject.SetProperty("Foreground", "#FF0000");
                        return false;
                    });
                    this.tRed.SetProperty("TileTop", tButLoc++);
                    if (!cde.CBool(this.GetSetting["ShowColors"]))
                        this.tRed.SetProperty("Visibility", false);

                    this.tGreen = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Green", "Style=position:absolute; right:0px; background-color:#00FF00; background-image:none;"] });
                    this.tGreen.SetProperty("OnClick", () => {
                        this.MyDrawingObject.SetProperty("Foreground", "#00FF00");
                        return false;
                    });
                    this.tGreen.SetProperty("TileTop", tButLoc++);
                    if (!cde.CBool(this.GetSetting["ShowColors"]))
                        this.tGreen.SetProperty("Visibility", false);

                    this.tYellow = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Yellow", "Style=position:absolute; right:0px; background-color:#FFFF00; background-image:none;"] }); 
                    this.tYellow.SetProperty("OnClick", () => {
                        this.MyDrawingObject.SetProperty("Foreground", "#FFFF00");
                        return false;
                    });
                    this.tYellow.SetProperty("TileTop", tButLoc++);
                    if (!cde.CBool(this.GetSetting["ShowColors"]))
                        this.tYellow.SetProperty("Visibility", false);

                    this.tBlue = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Blue", "Style=position:absolute; right:0px; background-color:#0000FF; background-image:none;"] }); 
                    this.tBlue.SetProperty("OnClick", () => {
                        this.MyDrawingObject.SetProperty("Foreground", "#0000FF");
                        return false;
                    });
                    this.tBlue.SetProperty("TileTop", tButLoc++);
                    if (!cde.CBool(this.GetSetting["ShowColors"]))
                        this.tBlue.SetProperty("Visibility", false);

                    this.tPink = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileButton).Create(this.drawingTarget, { PostInitBag: ["TileWidth=1", "TileHeight=1", "Text=Pink", "Style=position:absolute; right:0px; background-color:#FF00FF; background-image:none;"] }); 
                    this.tPink.SetProperty("OnClick", () => {
                        this.MyDrawingObject.SetProperty("Foreground", "#FF00FF");
                        return false;
                    });
                    this.tPink.SetProperty("TileTop", tButLoc++);
                    if (!cde.CBool(this.GetSetting["ShowColors"]))
                        this.tPink.SetProperty("Visibility", false);
                }
            }

            if (window.addEventListener) {
                window.addEventListener("resize", () => { this.ResizeEventHandler(); }, false);
            }
            this.SetElement(this.mBaseDiv.GetElement());

            if (!this.MyFieldInfo || (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) !== 0)) {
                this.PreventDefaultManipulationAndMouseEvent(null);
            }
            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ResizeEventHandler());
            }

            this.MyDrawingObject.ApplySkin();

            pTargetControl.RegisterEvent("OnLoaded", () => {
                this.ResizeEventHandler();
            });

            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "iValue") {
                if (pValue === this.GetProperty("Value"))
                    return;
                this.mStrokes = new Array<TheDrawingObject>();
                this.ClearPicture();
                if (!pValue || pValue === '') {
                    if (this.MyDrawingObject)
                        this.MyDrawingObject.SetProperty("DataContext", null);
                }
                else {
                    if (pValue.substring(0, 2) === "[{") {
                        if (this.MyDrawingObject) {
                            let pObjects: TheDrawingObject[];
                            try {
                                pObjects = JSON.parse(pValue);
                                this.MyDrawingObject.SetProperty("DataContext", pObjects);
                            }
                            catch (e) {
                                this.MyDrawingObject.SetProperty("DataContext", null);
                            }
                        }
                    }
                    else {
                        if (!this.mTextFld)
                            this.ShowTextField(pValue, true);
                        else
                            this.mTextFld.SetProperty("Value", pValue);
                    }
                }
            } else if (pName === "IsSynced") {
                pValue = cde.CBool(pValue);
                if (this.mIsSynced === false && pValue)
                    this.RegisterSyncEvents();
                this.mIsSynced = pValue;
                if (this.mSaveButton)
                    this.mSaveButton.SetProperty("Visibility", this.mIsSynced);
            } else if (pName === "ShowSave") {
                this.mSaveButton.SetProperty("Visibility", cde.CBool(pValue));
            } else if (pName === "ShowPlay") {
                this.mPlayButton.SetProperty("Visibility", cde.CBool(pValue));
            } else if (pName === "ShowColors") {
                this.tBlack.SetProperty("Visibility", cde.CBool(pValue));
                this.tBlue.SetProperty("Visibility", cde.CBool(pValue));
                this.tGreen.SetProperty("Visibility", cde.CBool(pValue));
                this.tPink.SetProperty("Visibility", cde.CBool(pValue));
                this.tRed.SetProperty("Visibility", cde.CBool(pValue));
                this.tYellow.SetProperty("Visibility", cde.CBool(pValue));
            } else if (pName === "IsAbsolute") {
                if (cde.CBool(pValue)) {
                    this.mBaseDiv.GetElement().style.position = "absolute";
                    this.drawingTarget.GetElement().style.position = "absolute";
                }
                else {
                    this.mBaseDiv.GetElement().style.position = "relative";
                    this.drawingTarget.GetElement().style.position = "relative";
                }
            } else if (pName === "IsOverlay") {
                pValue = cde.CBool(pValue);
                this.tBlack.SetProperty(pName, pValue);
                this.tYellow.SetProperty(pName, pValue);
                this.tGreen.SetProperty(pName, pValue);
                this.tRed.SetProperty(pName, pValue);
                this.tBlue.SetProperty(pName, pValue);
                this.tPink.SetProperty(pName, pValue);
                this.mSaveButton.SetProperty(pName, pValue);
                this.mPlayButton.SetProperty(pName, pValue);
                this.mClearButton.SetProperty(pName, pValue);
            }
            if (this.MyDrawingObject && pName !== "Style") {
                this.MyDrawingObject.SetProperty(pName, pValue);
            }
            super.SetProperty(pName, pValue);
            if (pName === "AutoAdjust") {
                this.ResizeEventHandler();
            }
        }

        public GetProperty(pName: string) {
            if (pName === "Value" && this.MyFieldInfo && (this.MyFieldInfo.Flags & 1) === 0) {
                if (this.mIsTextFldVisible)
                    return this.mTextFld.GetProperty("Value");
            }
            return super.GetProperty(pName);
        }

        ProcessFiles(pFileList: FileList) {
            if (!pFileList || !pFileList.length) return;

            const file: File = pFileList[0];

            if (file.name.length > 8 && file.name.substring(file.name.length - 7) === ".ink2me") {
                const reader = new FileReader();
                reader.onload = () => {
                    const tres = reader.result;
                    this.SetProperty("iValue", tres);
                    if (this.mIsSynced && this.MyTRF && cdeNMI.MyEngine) {
                        cdeNMI.MyEngine.GetBaseEngine().PublishCentral("SCREENSYNC:" + this.MyTRF.GetHash(), tres as any);
                    }
                };
                reader.readAsText(file);
            }
        }

        public PostCreate(pTE: INMITileEntry) {
            this.RegisterEvent("OnSavePicture", (thisObj: INMIControl, pData: string) => {
                if (cde.MyContentEngine) {
                    if (this.MyFieldInfo)
                        cde.MyContentEngine.PublishToNode(this.MyFieldInfo.cdeN, "CDE_FILEPUSH:IMG" + cdeNMI.DateToMini(new Date()) + ".PNG", pData);
                    else
                        cde.MyContentEngine.PublishToService("CDE_FILEPUSH:IMG" + cdeNMI.DateToMini(new Date()) + ".PNG", pData);
                }
            });
        }

        public RegisterSyncEvents() {
            this.RegisterIncomingMessage(cdeNMI.eTheNMIEngine, (thisObj: ctrlTouchDraw, pMSG: cde.TheProcessMessage) => {
                const tCmd: string[] = pMSG.Message.TXT.split(':');
                if (tCmd[1] === thisObj.MyTRF.GetHash()) {
                    switch (tCmd[0]) {
                        case "CLEARCANVAS":
                            thisObj.MyDrawingObject.ClearPicture();
                            break;
                        case "NEWDRAWOBJECT":
                            thisObj.MyDrawingObject.AddDrawingObject(JSON.parse(pMSG.Message.PLS), tCmd[2]);
                            break;
                        case "PLAYBOARD":
                            this.MyDrawingObject.SetProperty("Playback", true);
                            this.MyDrawingObject.DrawCanvasBackground();
                            break;
                        case "SCREENSYNC":
                            this.SetProperty("iValue", pMSG.Message.PLS);
                            break;
                        default:
                            break;
                    }
                }
            });
        }

        public AddDrawingObject(pObject, id) {
            this.MyDrawingObject.AddDrawingObject(pObject, id);
        }

        private SetMsgsAndTargetWidth(tEle: HTMLElement) {

            if (!this.MyTarget) return;
            const multidrawWidth = tEle.offsetWidth;
            const multidrawHeight = tEle.offsetHeight;
            if (multidrawWidth > 0 && this.drawingTarget) {
                this.drawingTarget.GetElement().style.width = multidrawWidth.toString() + "px";
            }
            if (multidrawHeight > 0 && this.drawingTarget)
                this.drawingTarget.GetElement().style.height = multidrawHeight.toString() + "px";
            this.MyDrawingObject.ApplySkin();
            this.MyDrawingObject.DrawCanvasBackground();
            this.MyDrawingObject.RequestRedraw();
        }

        public ClearPicture() {
            if (this.mTextFld)
                this.mTextFld.SetProperty("Value", "");
            if (this.MyDrawingObject)
                this.MyDrawingObject.ClearPicture();
        }

        public ResizeEventHandler() {
            this.mBaseDiv.GetElement().style.width = "inherit";
            this.mBaseDiv.GetElement().style.height = "inherit";
            this.MyDrawingObject.ApplySkin();
            this.SetMsgsAndTargetWidth(this.MyTarget.GetElement());
        }

        ShowTextField(pContent: string, bShowRightAway: boolean) {
            if (!this.mBaseDiv) return;
            const tFldInfo: TheFieldInfo = new TheFieldInfo(cdeControlType.TextArea, 8, "");
            if (this.MyFieldInfo) {
                tFldInfo.Flags = this.MyFieldInfo.Flags;
                tFldInfo.FormID = this.MyFieldInfo.FormID;
            }
            this.mTextFld = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleEnded).Create(null, { TRF: new TheTRF("", 0, tFldInfo), PostInitBag: ["iValue=" + pContent] }); 
            this.mTextFld.SetProperty("Rows", 10);
            this.mBaseDiv.AppendChild(this.mTextFld);
            if (bShowRightAway)
                this.drawingTarget.SetProperty("Visibility", false);
            else
                this.mTextFld.SetProperty("Visibility", false);
        }


        //legacy support
        public static Create(pTarget: INMIControl, pTRF: TheTRF, pUseAbsolute?: boolean, pXL?: number, pYL?: number, pFldContent?: string): cdeNMI.ctrlTouchDraw {
            const tTile: cdeNMI.ctrlTouchDraw = new cdeNMI.ctrlTouchDraw(pTRF);
            tTile.InitControl(pTarget, pTRF);
            if (pFldContent)
                tTile.SetProperty("iValue", pFldContent);
            return tTile;
        }
    }


    /**
    * Creates A draw Overlay ontop of another Control
    * The pTargetControl will be overlayed by the ctrlDrawOverlay
    * pTRF is handed to ctrlTouchDraw
    *
    * This control is NOT and input control for Form or Table
    *
    * (4.1 Ready!)
    */
    export class ctrlDrawOverlay extends TheNMIBaseControl implements cdeNMI.INMITouchOverlay {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        divTiles: HTMLDivElement = null;
        mDrawCanvas: INMIControl = null;
        public CurrentControl: INMIControl = null;
        public WasTouchedDownOn = false;   //Workaround for Chrome

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.DrawOverlay;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.divTiles = document.createElement('div');
            this.divTiles.style.position = "absolute";
            this.divTiles.style.top = "0px";
            this.divTiles.style.left = "0px";
            if (pTargetControl) {
                this.divTiles.style.width = pTargetControl.GetContainerElement().clientWidth - 5 + "px";  //-5 required to avoid scrollbars
                this.divTiles.style.height = pTargetControl.GetContainerElement().clientHeight - 5 + "px";
            }
            this.divTiles.id = "cdeOverlay";
            this.divTiles.className = "cdeDrawOverlay";
            this.divTiles.style.transformOrigin = "top left";
            const tScreen = cdeNMI.MyScreenManager.GetScreenByID(pScreenID);
            if (tScreen && tScreen.ScreenScale != 1.0 && tScreen.ScreenScale != 0.0) {
                this.divTiles.style.transform = "scale(" + 1 / tScreen.ScreenScale + ")";
            }

            this.SetElement(this.divTiles, false);

            this.PreventDefault = true;
            this.PreventManipulation = true;
            this.PreventDefaultManipulationAndMouseEvent(null);

            this.mDrawCanvas = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TouchDraw).Create(this, { TRF: (this.MyTRF ? this.MyTRF : new TheTRF("", 0, this.MyFieldInfo)) }); 
            this.CurrentControl = this.mDrawCanvas;

            this.HookEvents(false);
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "AutoAdjust") {
                super.SetProperty(pName, pValue);
                if (window.addEventListener) {
                    window.addEventListener("resize", () => { this.ResizeEventHandler(); }, false);
                }
                this.ResizeEventHandler();
            }
            this.mDrawCanvas.SetProperty(pName, pValue);
        }


        public ResizeEventHandler() {
            const w = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;

            const h = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;
            this.divTiles.style.width = w + "px";
            this.divTiles.style.height = h + "px";
        }

        //Legacy Support
        public static Create(pTargetControl: cdeNMI.TheNMIBaseControl, pTRF?: TheTRF, pClassName?: string): ctrlDrawOverlay {
            const t: ctrlDrawOverlay = new ctrlDrawOverlay(pTRF);
            t.InitControl(pTargetControl, pTRF);
            if (pClassName)
                t.SetProperty("ClassName", pClassName);
            return t;
        }
    }


    /**
* Creates a vertical or horizontal bar Chart
*
* (4.1 Ready!)
*/
    export class ctrlHashIcon extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        tIcon: TheDrawingObject;
        mCanvas: cdeNMI.INMICanvasDraw;
        mBaseCtrl: INMIControl;
        mRectangle: TheDrawingObject[];

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.BarChart;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.mBaseCtrl = cdeNMI.MyTCF.CreateBaseControl().Create(pTargetControl, { TRF: this.MyTRF });
            this.mBaseCtrl.SetElement(document.createElement("div") as HTMLElement);
            this.mBaseCtrl.SetInitialSize(1);
            this.mBaseCtrl.GetElement().style.position = "relative";

            this.mCanvas = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.CanvasDraw).Create(this.mBaseCtrl, { TRF: pTRF }) as INMICanvasDraw;
            this.SetElement(this.mBaseCtrl.GetElement(), true);

            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
            }
            return true;
        }

        public ApplySkin() {
            this.UpdateBar(this.GetProperty("Value"));
        }

        private UpdateBar(pValue) {
            if (!this.mCanvas) return;
            this.mCanvas.ApplySkin();
            if (this.mCanvas.MyHeight === 0 || this.mCanvas.MyWidth === 0) {
                this.mCanvas.ResizeCanvas();
                if (this.mCanvas.MyHeight === 0 || this.mCanvas.MyWidth === 0)
                    return;
            }
            this.tIcon = new TheDrawingObject();
            this.tIcon.Type = 7;
            this.tIcon.Visibility = true;
            this.tIcon.ComplexData = pValue;
            this.tIcon.Width = cdeNMI.GetSizeFromTile(cde.CInt(this.GetProperty("TileWidth"))) - 8;
            this.tIcon.Left = 4;
            this.tIcon.Top = 4;
            this.mRectangle = [];
            this.mRectangle.push(this.tIcon);
            this.mCanvas.SetProperty("DataContext", this.mRectangle);
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "iValue" || pName === "Value") {
                this.UpdateBar(pValue);
            } else if ((pName === "ControlTW" || pName === "ControlTH" || pName === "DrawMargin") && this.mCanvas) {
                pValue = cde.CInt(pValue);
                this.mCanvas.SetProperty(pName, pValue);
            }
            super.SetProperty(pName, pValue);
        }
    }


    /**
* Creates a vertical or horizontal bar Chart
*
* (4.1 Ready!)
*/
    export class ctrlBarChart extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        wasDrawnOnce = false;
        mRectangle: TheDrawingObject[];
        tText: TheDrawingObject;
        tRect: TheDrawingObject;

        mCanvas: cdeNMI.INMICanvasDraw;
        mBarColor = "#52D0EB";
        mMaxValue = 100;
        mMinValue = 0;
        mBaseCtrl: INMIControl;

        IsPointerDown = false;
        PointerID = 0;
        Scale = 1.0;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.BarChart;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                this.mBarColor = 'rgba(82,208,235,0.9)';
            else
                this.mBarColor = 'rgba(29,163,209,0.9)';

            this.mBaseCtrl = cdeNMI.MyTCF.CreateBaseControl().Create(pTargetControl, { TRF: this.MyTRF });
            this.mBaseCtrl.SetElement(document.createElement("div") as HTMLElement);
            this.mBaseCtrl.GetElement().className = "ctrlBarChart";
            this.mBaseCtrl.GetElement().style.position = "relative";

            this.mCanvas = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.CanvasDraw).Create(this.mBaseCtrl, { TRF: pTRF }) as INMICanvasDraw;

            this.SetElement(this.mBaseCtrl.GetElement(), true);

            this.SetProperty("Disabled", (!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0));
            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen) {
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
                    if (tScreen.ScreenScale != 1.0 && tScreen.ScreenScale != 0.0) {
                        this.Scale = 1.0;// 1/tScreen.ScreenScale
                    }
                }
            }
            cde.MyBaseAssets.RegisterEvent("ThemeSwitched", () => {
                if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                    this.mBarColor = 'rgba(82,208,235,0.9)';
                else
                    this.mBarColor = 'rgba(29,163,209,0.9)';
                this.UpdateBar(this.GetProperty("Value"));
            });
            return true;
        }

        public SetProperty(pName: string, pValue) {
            let isDirty = false;
            if (pName === "iValue" || pName === "Value") {
                if (!cde.IsNotSet(this.GetProperty("Format")))
                    pValue = parseFloat(pValue).toFixed(parseInt(this.GetProperty("Format")));
            } else if (pName === "Disabled") {
                if ((!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0))
                    pValue = true;
                this.EnableDisable(cde.CBool(pValue));
            }
            super.SetProperty(pName, pValue);
            let tStyle: HTMLSpanElement;
            if (pName === "Foreground") {
                tStyle = document.createElement("span");
                tStyle.style.color = pValue;
                this.mBarColor = tStyle.style.color;
                isDirty = true;
            } else if (pName === "Value" || pName === "iValue") {
                this.FireEvent(true, "BarChanged", "SetProperty", pValue);
                isDirty = true;
            } else if (pName === "MaxValue") {
                this.mMaxValue = cde.CDbl(pValue);
                isDirty = true;
            } else if (pName === "MinValue") {
                this.mMinValue = cde.CDbl(pValue);
                isDirty = true;
            } else if (pName === "MainBackground") {
                this.mBaseCtrl.GetElement().style.backgroundColor = pValue;
                isDirty = true;
            } else if (pName === "Background") {
                if (cde.CInt(pValue) > 0) {
                    tStyle = document.createElement("span");
                    tStyle.style.color = pValue;
                    this.mCanvas.SetProperty("Background", tStyle.style.color);
                }
                else
                    this.mCanvas.SetProperty("Background", pValue);
                isDirty = true;
            } else if (pName === "ForegroundOpacity") {
                this.mCanvas.SetProperty("Opacity", pValue);
                isDirty = true;
            } else if (pName === "LabelColor") {
                isDirty = true;
            } else if (pName === "IsVertical") {
                pValue = cde.CBool(pValue);
                if (pValue) {
                    super.SetProperty("IsVertical", pValue);
                }
                this.mCanvas.SetProperty("IsVertical", pValue);
                isDirty = true;
            } else if (pName === "IsInverted") {
                pValue = cde.CBool(pValue);
                if (cde.CBool(pValue)) {
                    super.SetProperty("IsInverted", pValue);
                }
                this.mCanvas.SetProperty("IsInverted", pValue);
                isDirty = true;
            } else if ((pName === "ControlTW" || pName === "ControlTH" || pName === "DrawMargin" || pName === "TileFactorX" || pName === "TileFactorY") && this.mCanvas) {
                pValue = cde.CInt(pValue);
                this.mCanvas.SetProperty(pName, pValue);
                isDirty = true;
            } else if (pName === "BarColorChanged") {
                this.RegisterEvent(pName, pValue);
            }

            if (isDirty)
                this.UpdateBar(this.GetProperty("Value"));
        }

        public ApplySkin() {
            this.UpdateBar(this.GetProperty("Value"));
        }

        private UpdateBar(pValue) {
            if (!this.mCanvas) return;
            this.mCanvas.ApplySkin();
            if (this.mCanvas.MyHeight === 0 || this.mCanvas.MyWidth === 0) {
                this.mCanvas.ResizeCanvas();
                if (this.mCanvas.MyHeight === 0 || this.mCanvas.MyWidth === 0)
                    return;
            }
            if (pValue === "")
                pValue = 0;
            this.wasDrawnOnce = true;
            this.tText = new TheDrawingObject();
            this.tText.Type = 3;
            this.tText.Visibility = true;
            this.tRect = new TheDrawingObject();
            this.tRect.Type = 1;
            if (this.GetProperty("IsVertical") === true) {
                this.tRect.Left = 0;
                this.tText.Left = 12;
                this.tRect.Width = this.mCanvas.MyWidth;
                if (this.GetProperty("IsInverted") === true) {
                    this.tRect.Top = 0;
                    this.tRect.Height = (this.mCanvas.MyHeight / (this.mMaxValue - this.mMinValue) * (parseFloat(pValue) - this.mMinValue));
                    this.tText.Top = this.tRect.Height + 12;
                }
                else {
                    this.tRect.Top = this.mCanvas.MyHeight - (this.mCanvas.MyHeight / (this.mMaxValue - this.mMinValue) * (parseFloat(pValue) - this.mMinValue));
                    this.tRect.Height = this.mCanvas.MyHeight;
                    this.tText.Top = this.tRect.Top - 12;
                }
                this.tRect.Fill = this.mBarColor;
            } else {
                this.tRect.Top = 0;
                this.tText.Top = 12;
                if (this.GetProperty("IsInverted") === true) {
                    this.tRect.Left = this.mCanvas.MyWidth - (this.mCanvas.MyWidth / (this.mMaxValue - this.mMinValue) * (cde.CDbl(pValue) - this.mMinValue));
                    this.tRect.Width = this.mCanvas.MyWidth;
                    this.tText.Left = this.tRect.Left + 12;
                }
                else {
                    this.tRect.Left = 0;
                    this.tRect.Width = (this.mCanvas.MyWidth / (this.mMaxValue - this.mMinValue) * (cde.CDbl(pValue) - this.mMinValue));
                    this.tText.Left = this.tRect.Width + 12;
                }
                this.tRect.Height = this.mCanvas.MyHeight;
                this.tRect.Fill = this.mBarColor;
            }
            if (cde.CBool(this.GetProperty("AutoAdjust"))) {
                if (cde.CDbl(pValue) > this.mMaxValue)
                    this.mMaxValue = parseFloat(pValue);
                if (cde.CDbl(pValue) < this.mMinValue)
                    this.mMinValue = parseFloat(pValue);
            }
            this.tRect.Visibility = true;
            this.tRect.IsTemp = true;
            this.mRectangle = [];
            this.mRectangle.push(this.tRect);
            this.tText.ComplexData = {};
            this.tText.ComplexData.Text = cde.CDbl(pValue).toFixed(0);
            this.tText.ComplexData.Font = "8pt Roboto";
            if (this.GetProperty("LabelColor"))
                this.tText.Fill = this.GetProperty("LabelColor");
            else
                this.tText.Fill = "black";
            this.tText.IsTemp = true;
            this.mRectangle.push(this.tText);
            this.mCanvas.SetProperty("DataContext", this.mRectangle);
        }

        CreateClip(pCanvas: HTMLCanvasElement) {
            const ctx: CanvasRenderingContext2D = pCanvas.getContext('2d');

            // Create a shape, of some sort
            ctx.beginPath();
            ctx.moveTo(10, 10);
            ctx.lineTo(100, 30);
            ctx.lineTo(180, 10);
            ctx.lineTo(200, 60);
            ctx.arcTo(222, 70, 120, 0, 10);
            ctx.lineTo(200, 180);
            ctx.lineTo(100, 150);
            ctx.lineTo(70, 180);
            ctx.lineTo(20, 130);
            ctx.lineTo(50, 70);
            ctx.closePath();
            // Clip to the current path
            ctx.clip();
        }

        EnableDisable(IsDisabled: boolean) {
            if (IsDisabled) {
                this.UnregisterEvent("PointerDown");
                this.UnregisterEvent("PointerMove");
                this.UnregisterEvent("PointerUp");
                this.UnregisterEvent("PointerCancel");
                this.PreventManipulation = false;
                this.PreventDefault = false;
            } else {
                this.RegisterEvent("PointerDown", (sender, evt, pt) => { this.sinkPointerDown(sender, evt, pt); });
                this.RegisterEvent("PointerMove", (sender, evt, pt) => { this.sinkTranslate(sender, evt, pt); });
                this.RegisterEvent("PointerUp", (sender, evt, pt) => { this.sinkPointerUp(sender, evt, pt); });
                this.RegisterEvent("PointerCancel", (sender, evt, pt) => { this.sinkPointerCancel(sender, evt, pt); });
                this.PreventManipulation = true
                this.PreventDefault = true;
            }
            this.PreventDefaultManipulationAndMouseEvent(null);
        }

        sinkPointerCancel(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            if (this.GetProperty("Disabled") === true) return;
            const thisObj: ctrlBarChart = pTarget as ctrlBarChart;
            if (cde.CBool(thisObj.GetProperty("AllowSetOnCancel")) && (pPointer.pointerType !== cdeInputEventType.MOUSE || cdeNMI.IsMouseDown)) {
                thisObj.sinkPointerUp(pTarget, pEvent, pPointer);
            }
            else
                thisObj.UpdateBar(thisObj.GetProperty("Value"));
        }

        sinkPointerUp(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            if (pTarget.GetProperty("Disabled") === true) return;
            const thisObj: ctrlBarChart = pTarget as ctrlBarChart;
            thisObj.IsPointerDown = false;
            thisObj.PointerID = 0;
            if (pPointer.pointerEvent === cdeNMI.cdeInputEvent.END)
                thisObj.CalcNewPos(pPointer.AdjPosition.x / thisObj.Scale, pPointer.AdjPosition.y / thisObj.Scale, 1);
        }

        sinkPointerDown(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            if (pTarget.GetProperty("Disabled") === true) return;
            const thisObj: ctrlBarChart = pTarget as ctrlBarChart;
            if (!thisObj.IsPointerDown && thisObj.GetProperty("Disabled") !== true) {
                thisObj.IsPointerDown = true;
                thisObj.PointerID = pPointer.Identifier;
                thisObj.CalcNewPos(pPointer.AdjPosition.x / thisObj.Scale, pPointer.AdjPosition.y / thisObj.Scale, 0);
            }
        }

        sinkTranslate(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            if (pTarget.GetProperty("Disabled") === true) return;
            const thisObj: ctrlBarChart = pTarget as ctrlBarChart;
            const tPS: number = thisObj.GetProperty("TouchPoints");
            if (tPS > 1)
                thisObj.CalcNewPos(pPointer.AdjPosition.x / thisObj.Scale, pPointer.AdjPosition.y / thisObj.Scale, 2);
            else
                thisObj.CalcNewPos(pPointer.AdjPosition.x / thisObj.Scale, pPointer.AdjPosition.y / thisObj.Scale, 0);
        }

        CalcNewPos(pX: number, pY: number, bSetVal: number) {
            if (!this.mCanvas) return;
            if (this.mCanvas.MyHeight === 0 || this.mCanvas.MyWidth === 0) {
                this.mCanvas.ResizeCanvas();
                if (this.mCanvas.MyHeight === 0 || this.mCanvas.MyWidth === 0)
                    return;
            }
            const tVal: number = this.GetProperty("Value");
            let tNewVal: number;
            if (this.GetProperty("IsVertical") === true) {
                if (this.GetProperty("IsInverted") !== true)
                    tNewVal = ((this.mCanvas.MyHeight - pY) * ((this.mMaxValue - this.mMinValue) / this.mCanvas.MyHeight)) + this.mMinValue;
                else
                    tNewVal = ((pY) * ((this.mMaxValue - this.mMinValue) / this.mCanvas.MyHeight)) + this.mMinValue;
            } else {
                if (this.GetProperty("IsInverted") !== true)
                    tNewVal = ((pX) * ((this.mMaxValue - this.mMinValue) / this.mCanvas.MyWidth)) + this.mMinValue;
                else
                    tNewVal = ((this.mCanvas.MyWidth - pX) * ((this.mMaxValue - this.mMinValue) / this.mCanvas.MyWidth)) + this.mMinValue;
            }


            if (!cde.CBool(this.GetProperty("UseFloat")))
                tNewVal = Math.round(tNewVal);
            if (tVal !== tNewVal && tNewVal !== -1) {
                if (bSetVal > 0) {
                    if (bSetVal === 1 || Math.abs(tNewVal - tVal) > 10) {
                        this.SetProperty("Value", tNewVal);
                        this.FireEvent(false, "ValueSet", { x: pX, y: pY } as TheDrawingPoint);
                        if (this.MyFieldInfo && cde.CBool(this.GetProperty("SendColor")) === true) {
                            const ctx: CanvasRenderingContext2D = this.mCanvas.GetBGRenderContext();
                            const colorData = ctx.getImageData(pX, pY, 1, 1).data;
                            const tColor = "rgb(" + colorData[0] + "," + colorData[1] + "," + colorData[2] + ")";
                            this.FireEvent(false, "BarColorChanged", this.rgbToHex(tColor));
                        }
                    }
                    if (bSetVal === 1) {
                        const MatTouch = new TheMaterialTouch()
                        MatTouch.ShowWave(this.GetElement(), { x: pX, y: pY } as TheDrawingPoint);
                    }
                }
                else {
                    this.FireEvent(true, "BarChanged", "CalcNewPos", tNewVal);
                    this.UpdateBar(tNewVal);
                }
            }
        }
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return "rgb(" + parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16) + ")";
        }

        rgbToHex(rgb) {
            const result = rgb.match(/\d+/g);
            function hex(x) {
                const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
                return isNaN(x) ? "00" : digits[(x - x % 16) / 16] + digits[x % 16];
            }

            return "#" + hex(result[0]) + hex(result[1]) + hex(result[2]);
        }

        //Backwards Compat

        public static Create(pTarget: INMIControl, pTRF: TheTRF): ctrlBarChart {
            const t: ctrlBarChart = new ctrlBarChart(pTRF);
            t.InitControl(pTarget, pTRF);
            return t;
        }
    }

    /**
     * Creates a vertical or horizontal slider looking like a rubber band
     * MultiTouch Scroll increases Value 5x Touchpoint - but Bar should not scroll differently!
     * (4.1 Ready!)
    **/
    export class ctrlEndlessSlider extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        tText: TheDrawingObject;
        mCanvas: cdeNMI.INMICanvasDraw = null;
        LastMiniValue = 0;
        mBaseCtrl: INMIControl = null;
        mDebugLabel: INMIControl = null;
        mDebugLabel2: INMIControl = null;

        mRangeSet = "";
        mRangeThreshhold: number[];
        mRangeSpeed: number[];
        mRangeRounder: number[];
        mRangeSnapper: number[];
        mAllowRollover = false;
        mAllowOffBelowMin = false;
        mMinVal = 0;
        mMaxVal = 1000;
        mSnapper = 0;
        mRoundTo = 1;
        mStepFactor = 10;
        mLines = 15;
        mLineWidth = 10;
        mLineGap = 40;
        mIsVertical = false;
        mIsInverted = false;
        mReturnDeltaOnly = false;
        mLineColor = "black";
        Is10x = false;
        TranslateSpeed = 1;

        IsPointerDown = false;
        LastMousePositionX = 0;
        LastMousePositionY = 0;
        mGripLines: TheDrawingObject[];
        ScrollValueTemp = 0;
        mLastScrollValue = 0;
        PointerID = 0;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.Slider;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            this.mBaseCtrl = cdeNMI.MyTCF.CreateBaseControl().Create(pTargetControl, { TRF: this.MyTRF });
            this.mBaseCtrl.SetElement(document.createElement("div") as HTMLElement);
            this.mBaseCtrl.SetInitialSize(1);
            this.mBaseCtrl.GetElement().className = "ctrlEndlessSlider";

            this.mBaseCtrl.GetElement().style.position = "relative";

            this.mCanvas = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.CanvasDraw).Create(this.mBaseCtrl, { TRF: pTRF }) as INMICanvasDraw;

            this.SetProperty("iValue", 0);

            this.CreateLines();

            this.SetElement(this.mBaseCtrl.GetElement(), true);

            this.SetProperty("Disabled", !this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0);
            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
            }
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "Disabled") {
                if ((!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0))
                    pValue = true;
                this.EnableDisable(cde.CBool(pValue));
            }
            super.SetProperty(pName, pValue);

            let UpdateLines = true;

            if (pName === "Foreground") {
                this.mLineColor = pValue;
            } else if (pName === "iValue") {
                this.mLastScrollValue = cde.CDbl(pValue) / this.mStepFactor;
                super.SetProperty("iValue", cde.CDbl(pValue));
                UpdateLines = false;
                this.CreateLines();
                this.RepositionLines();
            } else if (pName === "Value") {
                super.SetProperty("iValue", cde.CDbl(pValue));
                this.ScrollValueTemp = cde.CDbl(pValue) / this.mStepFactor;
                this.internalValueChanged(this.ScrollValueTemp, true);
                this.mLastScrollValue = this.ScrollValueTemp;
                UpdateLines = false;
                this.IsDirty = true;
            } else if (pName === "MaxValue") {
                this.mMaxVal = cde.CDbl(pValue);
                UpdateLines = false;
            } else if (pName === "MinValue") {
                this.mMinVal = cde.CDbl(pValue);
                UpdateLines = false;
            } else if (pName === "StepFactor") {
                this.mStepFactor = cde.CDbl(pValue);
                UpdateLines = false;
            } else if (pName === "AllowRollover") {
                this.mAllowRollover = cde.CBool(pValue);
                UpdateLines = false;
            } else if (pName === "IsVertical") {
                this.mIsVertical = cde.CBool(pValue);
            } else if (pName === "Background") {
                this.mCanvas.SetProperty("Background", pValue);
                this.mCanvas.RequestRedraw();
            } else if (pName === "MainBackground") {
                this.mBaseCtrl.GetElement().style.backgroundColor = pValue;
                this.mCanvas.RequestRedraw();
            } else if (pName === "LineWidth") {
                this.mLineWidth = cde.CInt(pValue);
            } else if (pName === "LineGap") {
                this.mLineGap = cde.CInt(pValue);
            } else if ((pName === "ControlTW" || pName === "ControlTH") && this.mCanvas) {
                this.mCanvas.SetProperty(pName, cde.CInt(pValue));
                UpdateLines = true;
            }

            if (UpdateLines) {
                this.ApplySkin();
            }
        }

        public ApplySkin() {
            this.CreateLines();
            this.RepositionLines();
        }


        EnableDisable(IsDisabled: boolean) {
            if (IsDisabled) {
                this.UnregisterEvent("PointerDown");
                this.UnregisterEvent("PointerMove");
                this.UnregisterEvent("PointerUp");
                this.PreventManipulation = false;
                this.PreventDefault = false;
            } else {
                this.RegisterEvent("PointerDown", this.sinkPointerDown);
                this.RegisterEvent("PointerMove", this.sinkTranslate);
                this.RegisterEvent("PointerUp", this.sinkPointerUp);
                this.PreventManipulation = true
                this.PreventDefault = true;
            }
            this.PreventDefaultManipulationAndMouseEvent(null);
        }

        sinkPointerUp(pTarget: INMIControl) { //, pEvent: Event, pPointer: ThePointer
            const thisObj: ctrlEndlessSlider = pTarget as ctrlEndlessSlider;
            thisObj.IsPointerDown = false;
            thisObj.PointerID = 0;
            thisObj.OnJumpBack();
        }

        sinkPointerDown(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            const thisObj: ctrlEndlessSlider = pTarget as ctrlEndlessSlider;
            if (!thisObj.IsPointerDown && thisObj.GetProperty("Disabled") !== true) {
                thisObj.LastMousePositionX = pPointer.AdjPosition.x;
                thisObj.LastMousePositionY = pPointer.AdjPosition.y;
                thisObj.IsPointerDown = true;
                thisObj.PointerID = pPointer.Identifier;
            }
        }

        sinkTranslate(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            const thisObj: ctrlEndlessSlider = pTarget as ctrlEndlessSlider;
            let tTrans: number = thisObj.TranslateSpeed;
            const tPS: number = thisObj.GetProperty("TouchPoints");
            if (thisObj.MyFieldInfo && (thisObj.MyFieldInfo.Flags & 2) === 0)
                return;
            if (tPS > 1)
                tTrans *= (5 * tPS);
            if (thisObj.IsPointerDown && pPointer.Identifier === thisObj.PointerID && thisObj.mCanvas) {
                if (thisObj.mIsVertical)
                    thisObj.internalValueChanged(thisObj.mLastScrollValue + ((((thisObj.LastMousePositionY - pPointer.AdjPosition.y) * (thisObj.Is10x ? tTrans * 10 : tTrans))) / thisObj.mCanvas.MyHeight), true);
                else
                    thisObj.internalValueChanged(thisObj.mLastScrollValue - ((((thisObj.LastMousePositionX - pPointer.AdjPosition.x) * (thisObj.Is10x ? tTrans * 10 : tTrans))) / thisObj.mCanvas.MyWidth), true);
                if (!thisObj.mReturnDeltaOnly)
                    thisObj.mLastScrollValue = thisObj.ScrollValueTemp;
                thisObj.LastMousePositionX = pPointer.AdjPosition.x;
                thisObj.LastMousePositionY = pPointer.AdjPosition.y;
            }
        }

        internalValueChanged(value: number, DoFireEvent: boolean): number { 
            let tRoundTo: number = this.mRoundTo;
            const tStepFactor: number = this.mStepFactor;
            let tVal: number = value * tStepFactor;
            let tSnap: number = this.mSnapper;
            if (this.mRangeSet) {
                for (let i = 0; i < this.mRangeThreshhold.length; i++) {
                    if (tVal > this.mRangeThreshhold[i]) {
                        this.TranslateSpeed = this.mRangeSpeed[i];
                        tRoundTo = this.mRangeRounder[i];
                        tSnap = this.mRangeSnapper[i];
                    }
                }
            }
            let tt: number;
            if (tSnap > 0 && this.LastMiniValue > 0) {
                tt = Math.floor(this.LastMiniValue * 1000);
                const tS: number = Math.floor(tSnap * 1000);
                if ((tt % tS) < 5 && Math.abs(value - this.ScrollValueTemp) < 0.003) {
                    this.RepositionLines();
                    return this.LastMiniValue;
                }
            }
            if (tRoundTo > 0) {
                tt = Math.floor(tVal / tRoundTo);
                tVal = tt * tRoundTo;
            }


            let tMini: number = tVal;
            if (this.mAllowRollover) {
                const diff: number = this.mMaxVal - this.mMinVal;
                tMini = tVal - this.mMinVal;
                tMini %= diff;
                if (tMini < 0) tMini = this.mMaxVal + tMini;
                if (tMini > this.mMaxVal) tMini -= this.mMaxVal;
                tMini += this.mMinVal;
            }
            else {
                if (tMini < this.mMinVal) {
                    if (this.mAllowOffBelowMin && (this.mLastScrollValue >= 0)) {
                        if (this.mLastScrollValue === 0 && value > 0)
                            tMini = this.mMinVal;
                        else
                            tMini = 0;
                    }
                    else
                        tMini = this.mMinVal;
                    value = tMini / tStepFactor;
                    this.mLastScrollValue = value;
                }
                if (tMini > this.mMaxVal) {
                    tMini = this.mMaxVal;
                    value = tMini / tStepFactor;
                    this.mLastScrollValue = value;
                }
            }
            this.LastMiniValue = tMini;
            if (isNaN(this.ScrollValueTemp))
                this.ScrollValueTemp = value;
            this.SetProperty("iValue", tMini);
            if (DoFireEvent) {
                this.FireEvent(false, "OniValueChanged", "iValChanged", tMini);
                this.FireEvent(true, "BarChanged", "iValChanged", tMini);
            }
            this.ScrollValueTemp = value;
            return tMini;
        }

        OnJumpBack() {
            this.SetProperty("iValue", this.LastMiniValue);
            this.IsDirty = true;
            this.FireEvent(true, "OnValueChanged", "OnJumpBack", this.LastMiniValue, this.MyTRF);
            if (!this.mReturnDeltaOnly)
                this.mLastScrollValue = this.ScrollValueTemp;
        }

        CreateLines() {
            if (!this.mCanvas) return;
            this.mCanvas.ApplySkin();
            if (this.mIsVertical)
                this.mLines = this.mCanvas.MyHeight / this.mLineGap;
            else
                this.mLines = this.mCanvas.MyWidth / this.mLineGap;
            this.mGripLines = [];
            for (let i = 0; i < this.mLines; i++) {
                const r: TheDrawingObject = new TheDrawingObject();
                r.Type = 1;
                r.StrokeThickness = 0;
                r.Fill = this.mLineColor;
                r.Width = this.mLineWidth;
                r.Height = this.mCanvas.MyHeight;
                r.Left = 0;
                r.Top = 0;
                r.IsTemp = true;
                if (this.mIsVertical) {
                    r.Width = this.mCanvas.MyWidth;
                    r.Height = this.mLineWidth;
                }
                this.mGripLines.push(r);
            }
        }

        RepositionLines() {
            if (!this.mCanvas || !this.mGripLines) return;
            for (let i = 0; i < this.mGripLines.length; i++) {
                let x: number;
                if (this.mIsVertical)
                    x = (this.ScrollValueTemp / (this.Is10x ? this.TranslateSpeed * 10 : this.TranslateSpeed) * this.mCanvas.MyHeight * 0.9) % this.mLineGap + i * this.mLineGap;
                else
                    x = (this.ScrollValueTemp / (this.Is10x ? this.TranslateSpeed * 10 : this.TranslateSpeed) * this.mCanvas.MyWidth * 0.9) % this.mLineGap + i * this.mLineGap;
                let tSize: number = this.mCanvas.MyWidth;
                if (this.mIsVertical) tSize = this.mCanvas.MyHeight;
                if (x >= 0 && x < tSize) {
                    if (this.mIsVertical) {
                        if (!this.mIsInverted)
                            this.mGripLines[i].Top = this.mCanvas.MyHeight - x;
                        else
                            this.mGripLines[i].Top = x;
                    }
                    else
                        this.mGripLines[i].Left = x;
                    this.mGripLines[i].Visibility = true;
                }
                else
                    this.mGripLines[i].Visibility = false;
            }
            this.tText = new TheDrawingObject(12, 12);
            this.tText.Type = 3;
            this.tText.Visibility = true;
            this.tText.ComplexData = {};
            this.tText.ComplexData.Text = cde.CDbl(this.LastMiniValue).toFixed(0);
            this.tText.ComplexData.Font = "8pt Roboto";
            if (this.GetProperty("LabelColor"))
                this.tText.Fill = this.GetProperty("LabelColor");
            else
                this.tText.Fill = "black";
            this.tText.IsTemp = true;
            this.mGripLines.push(this.tText);
            this.mCanvas.SetProperty("DataContext", this.mGripLines);
        }
    }

    /**
* Creates a Canvas Based Shape 
     *
     * This control is NOT and input control for Form or Table
* (4.1 Ready!)
*/
    export class ctrlShape extends cdeNMI.TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        mBaseCtrl: cdeNMI.INMIControl;
        mCanvas: cdeNMI.INMICanvasDraw;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeNMI.cdeControlType.Shape;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.mBaseCtrl = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup); 
            this.mBaseCtrl.InitControl(pTargetControl, this.MyTRF);
            this.mBaseCtrl.SetInitialSize(1);
            this.mBaseCtrl.SetProperty("ClassName", "ctrlShape");
            this.mBaseCtrl.SetProperty("Style", "position:relative;background-color:transparent");
            this.mCanvas = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.CanvasDraw) as cdeNMI.INMICanvasDraw;
            this.mCanvas.SetProperty("NoBackBuffer", true);
            this.mCanvas.InitControl(this.mBaseCtrl);

            if (!this.MyFieldInfo || (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) !== 0)) {
                this.mCanvas.SetProperty("OnPointerDown", (evt, pT, pP) => { this.SendPointer(evt, pT, pP); });
                if (cde.CBool(this.GetProperty("EnableMouseMove")))
                    this.mCanvas.SetProperty("OnPointerMove", (evt, pT, pP) => { this.SendPointer(evt, pT, pP); });
                this.mCanvas.SetProperty("OnPointerUp", (evt, pT, pP) => { this.SendPointer(evt, pT, pP); });
                this.mCanvas.SetProperty("OnPointerCancel", (evt, pT, pP) => { this.SendPointer(evt, pT, pP); });
                this.mCanvas.SetProperty("OnKeyUp", (evt) => { this.SendKey(evt); });
                this.mCanvas.SetProperty("OnKeyDown", (evt) => { this.SendKey(evt); });
            }
            this.SetElement(this.mBaseCtrl.GetElement());
            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
            }
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "Background") {
                this.mCanvas.SetProperty(pName, pValue);
            } else if (pName === "AddShape" || pName === "DrawShapes" || pName === "DrawShape" || pName === "AllowMoveWithoutDown" || pName === "Playback" || pName === "NoClear") {
                this.mCanvas.SetProperty(pName, pValue);
            } else if (pName === "SetShape" || pName === "Value" || pName === "iValue") {
                this.mCanvas.SetProperty("SetShape", pValue);
            } else if (pName === "EnableMouseMove") {
                if (cde.CBool(pValue))
                    this.mCanvas.SetProperty("OnPointerMove", (evt, pT, pP) => { this.SendPointer(evt, pT, pP); });
                else
                    this.mCanvas.SetProperty("OnPointerMove", null);
            } else if (pName === "YRatio" && this.mBaseCtrl) {
                const tEle: HTMLElement = this.mBaseCtrl.GetElement();
                if (tEle.style.width !== "inherit") {
                    const tRat = cde.CDbl(tEle.style.width.substr(0, tEle.style.width.length - 2)) / cde.CDbl(pValue);
                    tEle.style.height = tRat + "px";
                    tEle.style.maxHeight = tRat + "px";
                }
                this.mCanvas.SetProperty(pName, pValue);
            } else if ((pName === "ControlTW" || pName === "ControlTH" || pName === "DataContext" || pName === "CanvasWidth" || pName === "CanvasHeight" || pName === "TileFactorX" || pName === "TileFactorY") && this.mCanvas) {
                this.mCanvas.SetProperty(pName, pValue);
            }
            super.SetProperty(pName, pValue);
        }


        public ApplySkin() {
            this.mCanvas.ApplySkin();
            if (this.GetProperty("Value"))
                this.SetProperty("iValue", this.GetProperty("Value"));
        }
        SendKey(pEvent: KeyboardEvent) {
            if (cde.CBool(this.GetProperty("SendPointer"))) {
                let tEng: string = cdeNMI.eTheNMIEngine;
                if (this.GetProperty("EngineName"))
                    tEng = this.GetProperty("EngineName");
                const tKey: TheKey = new TheKey(pEvent);
                if (cde.MyBaseAssets.MyEngines[tEng]) {
                    if (this.MyFieldInfo)
                        cde.MyBaseAssets.MyEngines[tEng].PublishToNode(this.MyFieldInfo.cdeN, "UPDATE_KEY:" + this.GetProperty("MyThing"), JSON.stringify(tKey));
                    else
                        cde.MyBaseAssets.MyEngines[tEng].PublishToService("UPDATE_KEY:" + this.GetProperty("MyThing"), JSON.stringify(tKey));
                }
            }
        }
        SendPointer(pTarget: INMIControl, pEvent: Event, pPointer: ThePointer) {
            if (cde.CBool(this.GetProperty("SendPointer"))) {
                this.mCanvas.GetElement().setAttribute('tabindex', '0');
                this.mCanvas.GetElement().focus();
                let tEng: string = cdeNMI.eTheNMIEngine;
                if (this.GetProperty("EngineName"))
                    tEng = this.GetProperty("EngineName");
                pPointer.AdjPosition.x *= this.mCanvas.WidthRatio;
                pPointer.AdjPosition.y *= this.mCanvas.HeightRatio;
                if (cde.MyBaseAssets.MyEngines[tEng]) {
                    if (this.MyFieldInfo)
                        cde.MyBaseAssets.MyEngines[tEng].PublishToNode(this.MyFieldInfo.cdeN, "UPDATE_POINTER:" + this.GetProperty("MyThing"), JSON.stringify(pPointer));
                    else
                        cde.MyBaseAssets.MyEngines[tEng].PublishToService("UPDATE_POINTER:" + this.GetProperty("MyThing"), JSON.stringify(pPointer));
                }
            }
        }
    }


    /*************************************************

* Creates a Circular Gauge with a start and end angle. By default white on 50% opacity as a full circle starting with zero at the StartAngle
*
* (4.3 Ready!)
*/
    export class ctrlCircularGauge2 extends TheNMIBaseControl {
        constructor() {
            super(null, null);
        }

        containerTileGroup: INMIControl = null;
        canvas: HTMLCanvasElement = null;
        context: CanvasRenderingContext2D = null;
        savedInt: number;
        myframe;
        tempValue = 0;
        myPlotBand;

        public InitControl(pTargetControl: INMIControl, pTRF?: TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.containerTileGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(pTargetControl);

            let tMax: number = cde.CInt(this.GetProperty("MaxValue"));
            if (tMax === cde.CInt(this.GetProperty("MinValue")))
                tMax = 100;
            this.SetProperty("MaxValue", tMax);

            if (this.GetProperty("MainBackground"))
                this.containerTileGroup.SetProperty("Background", this.GetProperty("MainBackground"));

            this.canvas = document.createElement("canvas");
            this.containerTileGroup.GetElement().appendChild(this.canvas);
            const tW: number = cde.CInt(this.GetSetting("ControlTW"));
            const tH: number = cde.CInt(this.GetSetting("ControlTH"));
            this.canvas.width = 0;
            this.canvas.height = 0;
            this.context = this.canvas.getContext("2d");

            if (tW > 0) {
                this.containerTileGroup.SetProperty("TileWidth", tW);
                this.canvas.width = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileWidth"));
            }
            if (tH > 0) {
                this.containerTileGroup.SetProperty("TileHeight", tH);
                this.canvas.height = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileHeight"));
            }

            cde.MyBaseAssets.RegisterEvent("ThemeSwitched", () => {
                this.DoRedraw();
            });
            this.DoRedraw();
            this.AnimateFrame(true);
            super.SetElement(this.containerTileGroup.GetElement());

            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            let bIsDirty = false;
            if (pName === "MainBackground") {
                if (!this.containerTileGroup) return;
                this.containerTileGroup.SetProperty("Background", pValue);
            } else if (pName === "Background") {
                bIsDirty = true;
            } else if (pName === "ControlTW" && this.context) {
                this.containerTileGroup.SetProperty("TileWidth", pValue);
                this.canvas.width = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileWidth"));
                bIsDirty = true;

            } else if (pName === "ControlTH" && this.context) {
                this.containerTileGroup.SetProperty("TileHeight", pValue);
                this.canvas.height = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileHeight"));
                bIsDirty = true;
            } else if (pName === "StartAngle" || pName === "EndAngle") {
                bIsDirty = true;
            } else if (pName === "PlotBand") {
                this.myPlotBand = JSON.parse(pValue);
                bIsDirty = true;
            }


            if (pName === "iValue" || pName === "Value") {
                this.savedInt = pValue;
                bIsDirty = true;
            } if (pName === "MaxValue" || pName === "MinValue" || pName === "Foreground") {
                bIsDirty = true;
            }
            if (bIsDirty && this.context)
                this.AnimateFrame(true);

        }

        DoRedraw() {
            if (!this.context || this.canvas.width === 0 || this.canvas.height === 0) return;
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);  // to clear canvas
            // circle
            let thick = (this.canvas.width / 7);
            let radius = (this.canvas.width / 2) - thick;
            if (this.canvas.height < this.canvas.width) {
                thick = (this.canvas.height / 7);
                radius = (this.canvas.height / 2) - thick;
            }

            this.context.beginPath();
            this.context.textAlign = 'center';
            this.context.strokeStyle = this.GetProperty("Foreground");

            const upperLimit = cde.CInt(this.GetProperty("UpperLimit"));
            const lowerLimit = cde.CInt(this.GetProperty("LowerLimit"));
            const maxValue = cde.CInt(this.GetProperty("MaxValue"));
            const minValue = cde.CInt(this.GetProperty("MinValue"));

            //arc
            const x = this.canvas.width / 2;
            const y = this.canvas.height / 2;

            const counterClockwise = cde.CBool(this.GetProperty("IsInverted"));

            let tSetStartAngle = cde.CInt(this.GetProperty("StartAngle")) - 90;
            if (tSetStartAngle < 0)
                tSetStartAngle += 360;

            let fullEndAngle = 360;
            if (this.GetProperty("EndAngle"))
                fullEndAngle = cde.CInt(this.GetProperty("EndAngle"));

            let tSetEndAngle;
            if (counterClockwise) {
                tSetEndAngle = fullEndAngle - tSetStartAngle;
                if (tSetEndAngle < 0)
                    tSetEndAngle += 360;
            }
            else {
                tSetEndAngle = fullEndAngle + tSetStartAngle;
                if (tSetEndAngle > 360)
                    tSetEndAngle -= 360;
            }

            const newAngVal: number = cdeNMI.cdeMinMax(this.tempValue, minValue, maxValue, fullEndAngle, 0);

            const startAngle = (Math.PI / 180) * tSetStartAngle;

            //Back Circle
            this.context.beginPath();
            this.context.arc(x, y, radius, startAngle, tSetEndAngle * (Math.PI / 180), counterClockwise);
            this.context.lineWidth = thick;
            if (this.GetProperty("Background"))
                this.context.strokeStyle = ctrlCanvasDraw.ProcessColor(this, this.context, this.GetProperty("Background"));
            else {
                if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                    this.context.strokeStyle = "rgba(80, 80, 80, 0.1)";
                else
                    this.context.strokeStyle = "rgba(80, 80, 80, 0.5)";
            }
            this.context.stroke();

            //Value Circle
            let endAngle = 0;
            if (counterClockwise)
                endAngle = (Math.PI / 180) * (newAngVal + tSetStartAngle); //this is the point where the arc stops
            else
                endAngle = (Math.PI / 180) * ((fullEndAngle - newAngVal) + tSetStartAngle); //this is the point where the arc stops

            let whitePart;
            if (this.GetProperty("Foreground"))
                whitePart = ctrlCanvasDraw.ProcessColor(this, this.context, this.GetProperty("Foreground"));
            else {
                if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                    whitePart = 'rgba(82,208,235,0.9)';
                else
                    whitePart = 'rgba(29,163,209,0.9)';
            }
            this.context.beginPath();
            this.context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
            this.context.lineWidth = thick;
            this.context.strokeStyle = whitePart;
            this.context.stroke();

            const context = this.context;
            const gradient = context.createLinearGradient(x, y, this.canvas.width, this.canvas.height / 2);
            gradient.addColorStop(0.2, 'rgba(255,50,50,0.302)');
            gradient.addColorStop(.6, 'rgba(255,0,0,.549)');
            gradient.addColorStop(.6, 'rgba(255,0,0,1.0)');
            //Limit Shaders
            if (upperLimit > minValue) {
                const valMaxLim = cdeNMI.cdeMinMax(upperLimit, maxValue, minValue, fullEndAngle, 0);
                //if (this.tempValue > upperLimit)
                {
                    context.beginPath();
                    context.lineWidth = thick;
                    context.strokeStyle = gradient;
                    context.arc(x, y, radius, (valMaxLim + tSetStartAngle) * (Math.PI / 180), tSetEndAngle * (Math.PI / 180), counterClockwise);
                    context.stroke();
                }
            }
            if (lowerLimit > minValue) {
                const valLowLim = cdeNMI.cdeMinMax(lowerLimit, maxValue, minValue, fullEndAngle, 0);
                //if (this.tempValue < lowerLimit)
                {
                    context.beginPath();
                    context.lineWidth = thick;
                    context.strokeStyle = gradient;
                    if (!counterClockwise)
                        endAngle = (Math.PI / 180) * (valLowLim + tSetStartAngle); //this is the point where the arc stops
                    else
                        endAngle = (Math.PI / 180) * ((fullEndAngle - valLowLim) + tSetStartAngle); //this is the point where the arc stops

                    context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
                    context.stroke();
                }
            }

            if (this.myPlotBand) {
                for (const idx in this.myPlotBand) {
                    const tFrom = cdeNMI.cdeMinMax(this.myPlotBand[idx].from, maxValue, minValue, fullEndAngle, 0);
                    const tTo = cdeNMI.cdeMinMax(this.myPlotBand[idx].to, maxValue, minValue, fullEndAngle, 0);
                    context.beginPath();
                    context.lineWidth = thick * .4;
                    context.strokeStyle = this.myPlotBand[idx].color;
                    if (!counterClockwise)
                        endAngle = (Math.PI / 180) * (tTo + tSetStartAngle); //this is the point where the arc stops
                    else
                        endAngle = (Math.PI / 180) * ((fullEndAngle - tTo) + tSetStartAngle); //this is the point where the arc stops

                    context.arc(x, y, radius * .88, (Math.PI / 180) * (tFrom + tSetStartAngle), endAngle, counterClockwise);
                    context.stroke();
                }
            }

            //text
            //RobotoLight
            this.context.font = thick + 'pt Roboto';
            if (this.GetProperty("Foreground"))
                this.context.fillStyle = this.GetProperty("Foreground");
            else
                this.context.fillStyle = whitePart;
            let tLabel: string;
            if (cde.CBool(this.GetProperty("DontAnimate")) === false) {
                if (this.GetProperty("Format"))
                    tLabel = this.tempValue.toFixed(cde.CInt(this.GetProperty("Format")));
                else
                    tLabel = Math.floor(this.tempValue).toString();
            }
            else {
                if (this.GetProperty("Format"))
                    tLabel = cde.CDbl(this.GetProperty("Value")).toFixed(cde.CInt(this.GetProperty("Format")));
                else
                    tLabel = Math.floor(cde.CDbl(this.GetProperty("Value"))).toString();
            }
            //centering canvas text
            this.context.fillText(tLabel, x, y + (thick / 2));

            //SubTitle Text
            if (this.GetProperty("SubTitle")) {
                context.font = '16pt Roboto';
                context.fillStyle = whitePart;
                context.fillText(this.GetProperty("SubTitle"), x, y + (thick * 2));
            }
        }

        AnimateFrame(pForce: boolean) {
            this.myframe = requestAnimationFrame(() => { this.AnimateFrame(false); });
            if (cde.CBool(this.GetProperty("DontAnimate")) === true) {
                cancelAnimationFrame(this.myframe);
                this.tempValue = cde.CDbl(this.GetProperty("Value"));
                this.DoRedraw();
                return;
            }
            let tDbl: number;
            if (cde.CDbl(this.GetProperty("Value")) < this.tempValue) {
                tDbl = (this.tempValue - cde.CDbl(this.GetProperty("Value"))) / 20;
                this.tempValue -= tDbl;
                if (!pForce && (cde.CDbl(this.GetProperty("Value")) > this.tempValue || Math.abs(tDbl) < 0.001)) {
                    cancelAnimationFrame(this.myframe);
                    this.tempValue = cde.CDbl(this.GetProperty("Value"));
                }
            }
            else {
                tDbl = (cde.CDbl(this.GetProperty("Value")) - this.tempValue) / 20;
                this.tempValue += tDbl;
                if (!pForce && (cde.CDbl(this.GetProperty("Value")) < this.tempValue || Math.abs(tDbl) < 0.001)) {
                    cancelAnimationFrame(this.myframe);
                    this.tempValue = cde.CDbl(this.GetProperty("Value"));
                }
            }
            this.DoRedraw();
        }

    }

    /**
* Creates a 
*
* (4.3 Ready)
*/
    export class ctrlSmartGauge2 extends TheNMIBaseControl {
        constructor() {
            super(null, null);
        }

        GaugeShell: INMIControl = null;

        tempValue = 0;

        whiteRGBA = 'rgba(255,255,255,0.5)';
        blackRGBA = 'rgba(0,0,0,0.5)';
        darkslategrayRGBA = 'rgba(47,79,79,.5)';
        mBackground = 'rgba(80,80,80,0.5)'

        mycanvas: HTMLCanvasElement = null;
        mycontext = null;
        startAngle = 0;
        endAngle = 0;
        counterClockwise = false;
        mWidth = 0;
        mHeight = 0;
        myframe;

        public InitControl(pTargetControl: INMIControl, pTRF?: TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            this.GaugeShell = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(pTargetControl);
            this.GaugeShell.GetElement().style.width = "inherit";
            this.GaugeShell.GetElement().style.height = "inherit";

            this.mycanvas = document.createElement("Canvas") as HTMLCanvasElement;
            this.GaugeShell.GetElement().appendChild(this.mycanvas);
            this.mycontext = this.mycanvas.getContext('2d');
            if (cde.CInt(this.GetProperty("MaxValue")) === 0)
                this.SetProperty("MaxValue", 100);

            this.startAngle = (1 * Math.PI);
            this.endAngle = 0 * Math.PI;
            this.counterClockwise = false;

            this.SetElement(this.GaugeShell.GetElement());

            this.AnimateFrame(true);

            if (cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFieldInfo.FormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
            }
            cde.MyBaseAssets.RegisterEvent("ThemeSwitched", () => {
                this.DoRender();
            });
            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            let bIsDirty = false;
            if (pName === "Value" || pName === "iValue" || pName === "Foreground" || pName === "Title" || pName === "SubTitle") {
                bIsDirty = true;
            } else if (pName === "MainBackground" && this.GaugeShell) {
                this.GaugeShell.SetProperty("Background", pValue);
            } else if (pName === "Background" && this.GaugeShell) {
                this.mBackground = pValue;
                this.IsDirty = true;
            } else if (pName === "Title") {
                bIsDirty = true;
            } else if (pName === "SubTitle" || pName === "LowerLimit" || pName === "UpperLimit") {
                bIsDirty = true;
            }
            if (bIsDirty)
                this.AnimateFrame(true);
        }



        public ApplySkin() {
            if (!this.GaugeShell.GetElement()) return;
            this.mWidth = this.GaugeShell.GetElement().clientWidth;
            this.mycanvas.width = this.mWidth;
            this.mHeight = this.GaugeShell.GetElement().clientHeight;
            this.mycanvas.height = this.mHeight;
            if (this.mHeight > 0 && this.mWidth > 0)
                this.AnimateFrame(true);
        }



        DoRender() {
            if (!this.mycanvas || this.mWidth === 0 || this.mHeight === 0) return;
            const context: CanvasRenderingContext2D = this.mycontext as CanvasRenderingContext2D;
            const canvas = this.mycanvas;
            const x = this.mycanvas.width / 2;
            const y = this.mycanvas.height - 16;
            const radius = x - (y * .20);
            context.clearRect(0, 0, canvas.width, canvas.height);

            if (!this.GetProperty("Background")) {
                if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                    this.mBackground = "rgba(80, 80, 80, 0.1)";
                else
                    this.mBackground = "rgba(80, 80, 80, 0.5)";
            }

            context.beginPath();
            context.arc(x, y, radius, this.startAngle, this.endAngle, this.counterClockwise);
            context.lineWidth = y * 0.01;
            context.strokeStyle = this.mBackground;
            context.fillStyle = this.mBackground;
            context.stroke();

            let myBlue = this.GetProperty("Foreground");
            if (!myBlue) {
                if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                    myBlue = 'rgba(82,208,235,0.9)';
                else
                    myBlue = 'rgba(29,163,209,0.9)';
            }
            const upperLimit = cde.CInt(this.GetProperty("UpperLimit"));
            const lowerLimit = cde.CInt(this.GetProperty("LowerLimit"));
            let myValue = cde.CDbl(this.tempValue);
            if (!cde.CBool(this.GetProperty("UseFloat")))
                myValue = Math.floor(myValue);
            const maxValue = cde.CInt(this.GetProperty("MaxValue"));
            const minValue = cde.CInt(this.GetProperty("MinValue"));


            if (myValue > maxValue)
                myValue = maxValue;


            context.clearRect(0, canvas.height - 12, canvas.width, 12);
            let valAngle = cdeNMI.cdeMinMax(myValue, maxValue, minValue, 180, 0);
            if (valAngle < 0)
                valAngle = 0;

            //value visual
            context.beginPath();
            context.arc(x, y, radius, this.startAngle, this.startAngle + (valAngle * (Math.PI / 180)), this.counterClockwise);
            context.lineWidth = y * .15;
            context.strokeStyle = myBlue;
            context.stroke();
            //value text
            //small RED  value visual to the right
            const gradient = context.createLinearGradient(x, y, canvas.width, canvas.height / 2);
            gradient.addColorStop(0.2, 'rgba(255,50,50,0.302)');
            gradient.addColorStop(.6, 'rgba(255,0,0,.549)');
            gradient.addColorStop(.6, 'rgba(255,0,0,1.0)');

            let whitePart;
            if (this.GetProperty("LabelForeground"))
                whitePart = ctrlCanvasDraw.ProcessColor(this, context, this.GetProperty("LabelForeground"));
            else {
                if (!cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                    whitePart = 'rgba(82,208,235,0.9)';
                else
                    whitePart = 'rgba(29,163,209,0.9)';
            }
            //Title Text
            if (this.GetProperty("Title") && cde.CBool(this.GetProperty("NoTE"))) {
                context.font = '16pt Roboto';
                context.fillStyle = whitePart;
                context.fillText(this.GetProperty("Title"), x - context.measureText(this.GetProperty("Title")).width / 2, 18);
            }
            //SubTitle Text
            if (this.GetProperty("SubTitle")) {
                context.font = '16pt Roboto';
                context.fillStyle = whitePart;
                context.fillText(this.GetProperty("SubTitle"), x - context.measureText(this.GetProperty("SubTitle")).width / 2, y + 10);
            }


            if (upperLimit > minValue) {
                const valMaxLim = cdeNMI.cdeMinMax(upperLimit, maxValue, minValue, 180, 0);
                if (myValue > upperLimit) {
                    context.beginPath();
                    context.lineWidth = 10;
                    context.strokeStyle = gradient;
                    context.arc(x, y, radius * .90, this.startAngle + (valMaxLim * (Math.PI / 180)), this.startAngle + (valAngle * (Math.PI / 180)), this.counterClockwise);
                    context.stroke();
                }



                //upper limit TEXT
                context.font = '10pt Roboto';
                context.fillStyle = 'rgb(255,192,0)';
                context.fillText(upperLimit.toString(), x * 1.20, y * 0.95);


                //upper limit 
                context.beginPath();
                context.arc(x, y, radius - 3, this.startAngle + ((valMaxLim - 1) * (Math.PI / 180)), this.startAngle + ((valMaxLim + 1) * (Math.PI / 180)), this.counterClockwise);
                context.lineWidth = y * .2;
                context.strokeStyle = 'rgba(255,192,0,.8)';
                context.stroke();
            }
            if (lowerLimit > minValue) {
                const valLowLim = cdeNMI.cdeMinMax(lowerLimit, maxValue, minValue, 180, 0);
                if (myValue < lowerLimit) {
                    context.beginPath();
                    context.lineWidth = 10;
                    context.strokeStyle = gradient;
                    context.arc(x, y, radius * .90, this.startAngle + (valAngle * (Math.PI / 180)), this.startAngle + (valLowLim * (Math.PI / 180)), this.counterClockwise);
                    context.stroke();
                }
                //lower limit text
                context.font = '10pt Roboto';
                context.fillStyle = 'rgb(255,192,0)';
                context.fillText(lowerLimit.toString(), x * .70, y * .95);


                //lower limit
                context.beginPath();
                context.arc(x, y, radius - 3, this.startAngle + ((valLowLim - 1) * (Math.PI / 180)), this.startAngle + ((valLowLim + 1) * (Math.PI / 180)), this.counterClockwise);
                context.lineWidth = y * .2;
                context.strokeStyle = 'rgba(255,192,0,.8)';
                context.stroke();
            }


            /////////////////////white line/////////this must change with background color
            context.strokeStyle = this.mBackground;
            context.lineWidth = 1;
            context.beginPath();
            context.arc(x, y, radius, this.startAngle, this.startAngle + (valAngle * (Math.PI / 180)), this.counterClockwise);
            context.stroke();


            let fontHeight = cde.CDbl(this.GetProperty("LabelFontSize"));
            if (fontHeight === 0)
                fontHeight = this.mycanvas.height * 0.25;
            context.font = fontHeight + 'pt Roboto';
            let myLabCol = this.GetProperty("LabelColor");
            if (!myLabCol)
                myLabCol = whitePart;

            if (myValue < lowerLimit && lowerLimit > minValue) {
                context.fillStyle = 'red';
            } else if (myValue > upperLimit && upperLimit > minValue) {
                context.fillStyle = 'red';
            } else
                context.fillStyle = myLabCol;

            let dValue:string = this.GetProperty("Value");
            if (cde.CInt(this.GetProperty("Digits")) > 0)
                dValue = cde.CDbl(this.GetProperty("Value")).toFixed(cde.CInt(this.GetProperty("Digits")));
            //centering canvas text
            if (cde.CBool(this.GetProperty("AnimateValue")))
                context.fillText(myValue.toString(), x - context.measureText(myValue.toString()).width / 2, y * 0.85);
            else
                context.fillText(dValue.toString(), x - context.measureText(dValue.toString()).width / 2, y * 0.85);

            //min-value(0) text

            context.fillStyle = myLabCol;
            context.font = '10pt Roboto';
            context.fillText(minValue.toString(), x - radius, y + 11);
            //max-value(0) text
            context.font = '10pt Roboto';
            context.fillText(maxValue.toString(), (x + radius) - (radius * .15), y + 11);

        }

        AnimateFrame(bForceDraw: boolean) {
            this.myframe = requestAnimationFrame(() => { this.AnimateFrame(false); });
            let tDbl: number;
            if (cde.CDbl(this.GetProperty("Value")) < this.tempValue) {
                tDbl = (this.tempValue - cde.CDbl(this.GetProperty("Value"))) / 20;
                this.tempValue -= tDbl;
                if (!bForceDraw && (cde.CDbl(this.GetProperty("Value")) > this.tempValue || Math.abs(tDbl) < 0.001)) {
                    cancelAnimationFrame(this.myframe);
                    this.tempValue = cde.CDbl(this.GetProperty("Value"));
                    //return;
                }
            }
            else {
                tDbl = (cde.CDbl(this.GetProperty("Value")) - this.tempValue) / 20;
                this.tempValue += tDbl;
                if (!bForceDraw && (cde.CDbl(this.GetProperty("Value")) < this.tempValue || Math.abs(tDbl) < 0.001)) {
                    cancelAnimationFrame(this.myframe);
                    this.tempValue = cde.CDbl(this.GetProperty("Value"));
                    //return;
                }
            }
            this.DoRender();
        }
    }
}