// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

using nsCDEngine.BaseClasses;
using nsCDEngine.Engines;
using nsCDEngine.Engines.NMIService;
using nsCDEngine.Engines.ThingService;
using nsCDEngine.ViewModels;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.Globalization;
using System.IO;
using System.Linq;

namespace CDMyC3
{
    public partial class ctrlC3Chart
    {
        public static void AddC3Chart(TheThing pMyBaseThing, TheFormInfo pForm, int pFldOrder, int parentFld, bool AddTestGroup, ThePropertyBag pBag)
        {
            if (pBag == null)
                pBag = new ThePropertyBag();
            if (parentFld >= 0)
                ThePropertyBag.PropBagUpdateValue(pBag, "ParentFld", "=", parentFld.ToString());
            var tChartCtrl = TheNMIEngine.AddSmartControl(pMyBaseThing, pForm, eFieldType.UserControl, pFldOrder, 2, 0, null, "SampleProperty", pBag);

            if (AddTestGroup)
            {
                TheNMIEngine.AddSmartControl(pMyBaseThing, pForm, eFieldType.CollapsibleGroup, pFldOrder + 1, 2, 0, "Chart Settings", null, new nmiCtrlCollapsibleGroup { ParentFld=parentFld, IsSmall = true, DoClose = true });
                var tFld = TheNMIEngine.AddSmartControl(pMyBaseThing, pForm, eFieldType.ComboBox, pFldOrder + 2, 2, 0, "Chart Type", null, new nmiCtrlComboBox { ParentFld = pFldOrder + 1, DefaultValue = "line", Options = "pie;bar;gauge;donut;spline;step;area;area-spline;area-step;scatter;line" });
                tFld.RegisterUXEvent(pMyBaseThing, eUXEvents.OnPropertyChanged, "Value", (sender, para) =>
                {
                    var t = para as TheProcessMessage;
                    if (t != null)
                    {
                        tChartCtrl.SetUXProperty(t.Message.GetOriginator(), $"ChartType={t.Message.PLS}");
                    }
                });
                var tFld2 = TheNMIEngine.AddSmartControl(pMyBaseThing, pForm, eFieldType.SingleCheck, pFldOrder + 3, 2, 0, "Update Data", null, new nmiCtrlSingleCheck { ParentFld = pFldOrder + 1 });
                tFld2.RegisterUXEvent(pMyBaseThing, eUXEvents.OnPropertyChanged, "Value", (sender, para) =>
                {
                    var t = para as TheProcessMessage;
                    if (t != null)
                    {
                        tChartCtrl.SetUXProperty(t.Message.GetOriginator(), $"UpdateData={t.Message.PLS}");
                    }
                });
            }
        }
    }








    /// <summary>
    /// Line Strip Chart - Original Code by Tobias Blattner - modified for used in Generic NMI by Chrism
    /// </summary>
    public partial class ctrlTimeLineChart
    {
        public static bool RegisterEvents(TheThing pBaseThing, TheFieldInfo pFldInfo)
        {
            pFldInfo.RegisterPropertyChanged((tQRField, pP) =>
            {
                SendStripChart(tQRField, pBaseThing.cdeMID, Guid.Empty);
            });
            ThePropertyBag.PropBagUpdateValue(pFldInfo.PropertyBag, "OnLoaded", "=", "y");
            TheCDEngines.MyNMIService.RegisterEvent($"{eNMIEvents.FieldLoaded}:{pFldInfo.cdeMID}", (pThing, pIncoming) =>
            {
                TheProcessMessage pMsg = pIncoming as TheProcessMessage;
                if (pMsg == null) return;

                string[] cmd = pMsg.Message.TXT.Split(':');
                TheFieldInfo tFld = TheNMIEngine.GetFieldById(TheCommonUtils.CGuid(cmd[1]));
                if (tFld != null)
                {
                    string[] tDI = pFldInfo.DataItem.Split('.');
                    string mDI = pFldInfo.DataItem;
                    if (tDI.Length > 2 && tDI[0] == "MyPropertyBag")
                    {
                        mDI = tDI[1];
                        if (tDI.Length > 3)
                        {
                            for (int i = 2; i < tDI.Length - 1; i++)
                                mDI += "." + tDI[i];
                        }
                    }
                    SendStripChart(tFld, pBaseThing.cdeMID, pMsg.Message.GetOriginator());
                }
            });
            return true;
        }


        private static void SendStripChart(TheFieldInfo tQRField, Guid pThingGuid, Guid pOrg)
        {
            List<TheDrawingObject> tSendLIst = new List<TheDrawingObject>();
            DateTimeOffset now = DateTimeOffset.Now;

            byte[] TargetBytes;
            using (MemoryStream memstream = new MemoryStream())
            {
                DrawStripHeader(now, tQRField).Save(memstream, ImageFormat.Png);
                TargetBytes = memstream.ToArray();
            }
            //StripHeaderImage = TargetBytes;
            cdeP tP = new cdeP("HeaderImage", null);
            tP.cdeT = 4;
            tP.Value = TargetBytes;

            TheNMIEngine.SetUXProperty(pOrg, tQRField.cdeMID, $"HeaderImage={tP}");

            Image tImg = DrawStrip(pThingGuid, now, tQRField);
            if (tImg != null)
            {
                using (MemoryStream memstream = new MemoryStream())
                {
                    tImg.Save(memstream, ImageFormat.Png);
                    TargetBytes = memstream.ToArray();
                }
                //StripImage = TargetBytes;
                cdeP tP2 = new cdeP("StripImage", null);
                tP2.cdeT = 4;
                tP2.Value = TargetBytes;

                TheNMIEngine.SetUXProperty(pOrg, tQRField.cdeMID, $"StripImage={tP2}");
            }
        }

        private static Image DrawStrip(Guid pThingGuid, DateTimeOffset now, TheFieldInfo pInfo)
        {
            int pixelWidth = 78 * TheCommonUtils.CInt(pInfo?.PropBagGetValue("TileWidth"));
            if (pixelWidth == 0) pixelWidth = 78;
            int Hours = TheCommonUtils.CInt(pInfo?.PropBagGetValue("Hours"));
            if (Hours == 0) Hours = 1;
            int pixelHeight = 1;
            Bitmap bmp = new Bitmap(pixelWidth, pixelHeight, PixelFormat.Format32bppArgb);

            int st = 0;
            string tColorString = pInfo?.PropBagGetValue("ChartColors");
            string[] htmlColors = null;
            if (string.IsNullOrEmpty(tColorString))
                htmlColors = TheBaseAssets.MyServiceHostInfo.StatusColors.Split(';');
            else
                htmlColors = tColorString.Split(';');
            Dictionary<int, SolidBrush> stateColorMapping = htmlColors.ToDictionary(x => st++, y => new SolidBrush(ColorTranslator.FromHtml(y)));

            TheThing tThing = TheThingRegistry.GetThingByMID("*", pThingGuid);
            if (tThing == null) return null;
            cdeP pMSH = ((ICDEThing)tThing.GetObject())?.GetProperty("MachineStorageHistory",false);
            if (pMSH == null) return null;
            List<TheMachineStateHistory> tList = TheCommonUtils.DeserializeJSONStringToObject<List<TheMachineStateHistory>>(pMSH.ToString());
            if (tList == null) return null;
            tList = tList.Where(s => now.Subtract(s.StateChangeTime).TotalHours < Hours).OrderBy(s => s.StateChangeTime).ToList();

            cdeP LastDeletedEntry = tThing.GetProperty("LastDeletedEntry",false);
            TheMachineStateHistory lastState = null;
            if (LastDeletedEntry != null)
            {
                TheMachineStateHistory tHis = TheCommonUtils.DeserializeJSONStringToObject<TheMachineStateHistory>(LastDeletedEntry.ToString());
                lastState = new TheMachineStateHistory() { State = tHis.State, StateChangeTime = now.Subtract(new TimeSpan(Hours, 0, 0)) };
            }

            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.ScaleTransform((float)pixelWidth / (Hours * 60 * 60), 1.0f);
                List<KeyValuePair<int, RectangleF>> rectangles = new List<KeyValuePair<int, RectangleF>>();
                foreach (var t in tList)
                {
                    if (lastState != null && t.State != lastState.State)
                    {
                        float start = (float)now.Subtract(t.StateChangeTime).TotalSeconds;
                        float size = (float)t.StateChangeTime.Subtract(lastState.StateChangeTime).TotalSeconds;
                        rectangles.Add(new KeyValuePair<int, RectangleF>(lastState.State, new RectangleF(new PointF(start, 0), new SizeF(size, pixelHeight))));
                        lastState = t;
                    }
                    if (lastState == null)
                    {
                        lastState = t;
                    }
                }
                if (lastState != null)
                {
                    float size = (float)now.Subtract(lastState.StateChangeTime).TotalSeconds;
                    rectangles.Add(new KeyValuePair<int, RectangleF>(lastState.State, new RectangleF(new PointF(0, 0), new SizeF(size, pixelHeight))));
                }
                if (rectangles.Count > 0)
                {
                    g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                    // g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                    for (int state = 0; state <= rectangles.Max(x => x.Key); state++)
                    {
                        if (stateColorMapping.ContainsKey(state))
                        {
                            IEnumerable<RectangleF> rects = rectangles.Where(x => x.Key == state).Select(x => x.Value);
                            var rectangleFs = rects as RectangleF[] ?? rects.ToArray();
                            if (rectangleFs.Any())
                            {
                                if (state > stateColorMapping.Count)
                                    g.FillRectangles(new SolidBrush(Color.Pink), rectangleFs.ToArray());
                                else
                                    g.FillRectangles(stateColorMapping[state], rectangleFs.ToArray());
                            }
                        }
                    }
                }
            }
            if (TheCommonUtils.CBool(pInfo?.PropBagGetValue("DrawRightToLeft")))
                bmp.RotateFlip(RotateFlipType.RotateNoneFlipX); //draw right to left
            return bmp;
        }

        private static Image DrawStripHeader(DateTimeOffset now, TheFieldInfo pInfo)
        {
            bool drawRightToLeft = (TheCommonUtils.CBool(pInfo?.PropBagGetValue("DrawRightToLeft")));
            int pixelWidth = 78 * TheCommonUtils.CInt(pInfo?.PropBagGetValue("TileWidth"));
            if (pixelWidth == 0) pixelWidth = 78;
            int Hours = TheCommonUtils.CInt(pInfo?.PropBagGetValue("Hours"));
            if (Hours == 0) Hours = 1;
            int pixelHeight = 39;
            Bitmap bmp = new Bitmap(pixelWidth, pixelHeight, PixelFormat.Format32bppArgb);

            DateTimeOffset start = now.Subtract(new TimeSpan(drawRightToLeft ? Hours : 0, now.Minute, now.Second));
            TimeSpan step = new TimeSpan(0, Hours * 5, 0);

            double scaling = (float)pixelWidth / (Hours * 60 * 60);

            using (Graphics g = Graphics.FromImage(bmp))
            {
                Font drawFont = new Font("Arial", 10);
                SolidBrush drawBrush = new SolidBrush(Color.Black); // Color.FromArgb(179, 255, 255, 255));
                DateTimeOffset currentTime = start;
                g.TextRenderingHint = TextRenderingHint.AntiAlias;
                for (int i = 0; i <= 12; i++)
                {
                    string pattern = CultureInfo.CurrentCulture.DateTimeFormat.MonthDayPattern;
                    pattern = pattern.Replace("MMMM", "MMM");
                    string timeValue = currentTime.DateTime.ToString(pattern) + "\n";

                    timeValue += currentTime.DateTime.ToShortTimeString();
                    SizeF size = g.MeasureString(timeValue, drawFont);
                    double x = now.Subtract(currentTime).TotalSeconds * scaling - size.Width / 2;
                    if (drawRightToLeft)
                    {
                        x = pixelWidth - x;
                    }
                    if (x >= -3 && x <= pixelWidth - size.Width + 3)
                    {
                        g.DrawString(timeValue, drawFont, drawBrush, new PointF((float)x, pixelHeight - size.Height - 5));
                    }
                    if (drawRightToLeft)
                    {
                        currentTime = currentTime.Add(step);
                    }
                    else
                    {
                        currentTime = currentTime.Subtract(step);
                    }
                }
            }
            return bmp;
        }
    }
}
