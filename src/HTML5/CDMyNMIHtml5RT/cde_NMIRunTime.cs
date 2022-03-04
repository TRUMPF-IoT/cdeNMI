// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿using nsCDEngine.BaseClasses;
using nsCDEngine.Communication;
using nsCDEngine.ViewModels;
using System;
using System.Collections.Generic;
using System.Text;
using nsCDEngine.Security;
using nsCDEngine.Engines.NMIService;

namespace NMIService
{
    /// <summary>
    /// The NMI Engine Main Class
    /// </summary>
    public partial class TheNMIHtml5RT
    {
        private string MyMainFrameHtml = "";
        static private string PageScale = "";
        static private string[] PlatformScale;
        private void InitNMIAssets()
        {
            if (TheBaseAssets.MyServiceHostInfo.ContentTemplate != Guid.Empty)
                MyMainFrameHtml = RenderMainFrameHtml(TheBaseAssets.MyServiceHostInfo.ContentTemplate);

        }

        private void InterceptHttpRequestSiteMap(TheRequestData pRequest)
        {
            pRequest.ResponseBufferStr = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">";
            foreach (ThePageDefinition tPage in TheNMIEngine.GetPages())
            {
                pRequest.ResponseBufferStr += string.Format("<url><loc>{0}{1}</loc><changefreq>daily</changefreq><lastmod>{2}-{3:00}-{4:00}</lastmod><priority>{5}</priority></url>", TheBaseAssets.MyServiceHostInfo.SiteName, tPage.PageName, tPage.EntryDate.Year, tPage.EntryDate.Month, tPage.EntryDate.Day, tPage.WPID / 10.0);
            }
            pRequest.ResponseBufferStr += "</urlset>";
            pRequest.ResponseMimeType = "text/xml";
            pRequest.ResponseBuffer = TheCommonUtils.CUTF8String2Array(pRequest.ResponseBufferStr);
            pRequest.AllowStatePush = true;
            pRequest.StatusCode = 200;
        }

        private void InterceptHttpRequestB4(TheRequestData pRequestData)
        {
            pRequestData.ResponseMimeType = "text/html";       

            switch (pRequestData.cdeRealPage.ToUpperInvariant())
            {
                case "/CDE/CDE.JS":
                    {
                        if (pRequestData.SessionState == null)
                        {
                            pRequestData.ResponseMimeType = "application/javascript";
                            pRequestData.ResponseBuffer = TheCommonUtils.CUTF8String2Array("//No Access Allowed");
                            pRequestData.AllowStatePush = false;
                            break;
                        }
                        var tRes = TheQueuedSenderRegistry.GetMyISBConnect(pRequestData, null, cdeSenderType.CDE_JAVAJASON);

                        string miniCore = TheCommonUtils.CArray2UTF8String(MyBaseEngine.GetPluginResource("cde.min.js"));
                        if (string.IsNullOrEmpty(miniCore))
                            miniCore = TheCommonUtils.CArray2UTF8String(MyBaseEngine.GetPluginResource("cde.js"));
                        string textjs = TheCommonUtils.GenerateFinalStr(miniCore);
                        string ISBPath = tRes.NPA;
                        if (TheBaseAssets.MyServiceHostInfo.cdeHostingType == cdeHostType.IIS && TheBaseAssets.MyServiceHostInfo.MyStationWSPort != 0 && !ISBPath.EndsWith(".ashx"))
                            ISBPath += ".ashx";
                        textjs = textjs.Replace("<%=ISBPATH%>", ISBPath);
                        pRequestData.ResponseMimeType = "application/javascript";
                        pRequestData.ResponseBuffer = TheCommonUtils.CUTF8String2Array(textjs);
                        pRequestData.AllowCaching = false;
                        pRequestData.AllowStatePush = true;
                    }
                    break;
                case "/ROBOTS.TXT":
                    pRequestData.ResponseMimeType = "text/plain";
                    string robot = TheBaseAssets.MyServiceHostInfo.Robots_txt;
                    robot += "\nSitemap: " + TheBaseAssets.MyServiceHostInfo.GetPrimaryStationURL(false) + "/sitemap.xml";
                    pRequestData.ResponseBuffer = TheCommonUtils.CUTF8String2Array(robot);
                    pRequestData.AllowStatePush = false;
                    break;
                case "/CHANNEL.HTML": //facebook SDK
                    string tChannel = "<script src=\"//connect.facebook.net/en_US/all.js\"></script>";
                    pRequestData.ResponseMimeType = "text/html";
                    pRequestData.ResponseBuffer = TheCommonUtils.CUTF8String2Array(tChannel);
                    pRequestData.AllowStatePush = false;
                    break;
            }
            if (pRequestData.ResponseBuffer != null)
                pRequestData.StatusCode = (int)eHttpStatusCode.OK;
        }

        private void InterceptHttpRequestAfter(TheRequestData pRequestData)
        {
            if (pRequestData.SessionState != null && !string.IsNullOrEmpty(pRequestData.RequestUri.Query) && pRequestData.RequestUri.Query.Contains("ref="))
                pRequestData.SessionState.InitReferer = pRequestData.RequestUri.Query;

            if (TheUserManager.IsInitialized() && TheNMIEngine.IsModelReady)
                RenderPage(pRequestData, MyMainFrameHtml, false);
            else
            {
                if (!TheBaseAssets.MyServiceHostInfo.DisableNMI)
                {
                    pRequestData.ResponseMimeType = "text/html";
                    pRequestData.ResponseBufferStr = IsInitalizationStr();
                    pRequestData.ResponseBuffer = TheCommonUtils.CUTF8String2Array(pRequestData.ResponseBufferStr);
                    pRequestData.AllowStatePush = true;
                    pRequestData.StatusCode = 200;
                }
            }
        }
        private void InterceptHttpRequestAfter2(TheRequestData pRequestData)
        {
            if (pRequestData.SessionState != null && !string.IsNullOrEmpty(pRequestData.RequestUri.Query) && pRequestData.RequestUri.Query.Contains("ref="))
                pRequestData.SessionState.InitReferer = pRequestData.RequestUri.Query;

            if (TheUserManager.IsInitialized() && TheNMIEngine.IsModelReady)
                RenderPage(pRequestData, MyMainFrameHtml, true);
            else
            {
                if (!TheBaseAssets.MyServiceHostInfo.DisableNMI)
                {
                    pRequestData.ResponseMimeType = "text/html";
                    pRequestData.ResponseBufferStr = IsInitalizationStr();
                    pRequestData.ResponseBuffer = TheCommonUtils.CUTF8String2Array(pRequestData.ResponseBufferStr);
                    pRequestData.AllowStatePush = true;
                    pRequestData.StatusCode = 200;
                }
            }
        }

        private string IsInitalizationStr()
        {
            string ResponseBufferStr = 
                "<html><head><meta http-equiv=\"Expires\" content=\"0\" /><meta http-equiv=\"Cache-Control\" content=\"no-cache\" /><meta http-equiv=\"Pragma\" content=\"no-cache\" /></html><body>" +
                $"<table width=\"100%\" style=\"height:100%; background-color: {TheBaseAssets.MyServiceHostInfo.BaseBackgroundColor};\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                $"<tr><td style=\"text-align:center;\"><p style=\"color: {TheBaseAssets.MyServiceHostInfo.BaseForegroundColor}; font-family: Arial; font-size: 36px\">C-DEngine is initializing...please try again in a couple seconds</p></td></tr>" +
                $"</table></body></HTML>";
            return ResponseBufferStr;
        }


        #region Main NMI Page Assembly
        /// <summary>
        /// Renders the Main Frame HTML Template specified by the GUID stored in ThePageContent
        /// </summary>
        /// <param name="pID"></param>
        /// <returns></returns>
        public string RenderMainFrameHtml(Guid pID)
        {
            string tMyMainFrameHtml = "";
            List<ThePageContent> tContent = TheNMIEngine.GetPageContentByID(pID);
            foreach (ThePageContent tContentDef in tContent)
                tMyMainFrameHtml += ReadPageBlock(tContentDef.WBID);
            if (string.IsNullOrEmpty(MyMainFrameHtml))
                MyMainFrameHtml = tMyMainFrameHtml;
            return tMyMainFrameHtml;
        }


        internal void RenderPage(TheRequestData pRequest, string pMainFrameHtml, bool MustExist)
        {
            if (pRequest == null) return;
            if (!TheNMIEngine.IsPageStoreReady())
            {
                ReturnNotInit(pRequest);
                return;
            }
            if (pRequest != null && pRequest.RequestUri != null && pRequest.RequestUri.Query.Length > 1)
            {
                string Query = pRequest.RequestUri.Query;
                if (Query.StartsWith("?"))
                    Query = Query.Substring(1);
                Dictionary<string, string> tQ = TheCommonUtils.ParseQueryString(Query);
                if (tQ.ContainsKey("WP"))
                {
                    pRequest.WebPlatform = (eWebPlatform)TheCommonUtils.CInt(tQ["WP"]);
                    if (pRequest.SessionState != null)
                        pRequest.SessionState.WebPlatform = pRequest.WebPlatform;
                }
                if (tQ.ContainsKey("CDEDL") && pRequest.SessionState!=null)
                {
                    pRequest.SessionState.HS = tQ["CDEDL"];
                }
                if (tQ.ContainsKey("TETO") && pRequest.SessionState != null)
                {
                    pRequest.SessionState.TETO = tQ["TETO"];
                }
            }
            eWebPlatform tWebPlatform = pRequest.WebPlatform;

            string pRealPage = pRequest.cdeRealPage;
            if (string.IsNullOrEmpty(pRealPage))
                pRealPage = pRequest.RequestUri.LocalPath;
            if (string.IsNullOrEmpty(pRealPage))
                return;
            if (string.IsNullOrEmpty(pMainFrameHtml))
                pMainFrameHtml = MyMainFrameHtml;
            ThePageDefinition tPageDefinition = TheNMIEngine.GetPageByRealPage(pRealPage);
            if (tPageDefinition==null)
            {
                if (MustExist) return;
                if (pRealPage.Substring(1).Contains("/")) return;
                if (string.IsNullOrEmpty(TheBaseAssets.MyServiceHostInfo.DefAccountPage)) return;
                tPageDefinition = TheNMIEngine.GetPageByID(TheCommonUtils.CGuid(TheBaseAssets.MyServiceHostInfo.DefAccountPage)); // MyNMIModel.MyPageDefinitionsStore.MyMirrorCache.TheValues.First(s => s.cdeMID == TheCommonUtils.CGuid(TheBaseAssets.MyServiceHostInfo.DefAccountPage));
            }
            if (tPageDefinition == null)
                return; // "ERR:Page Definition not found!";

            if (string.IsNullOrEmpty(tPageDefinition.ContentType))
                tPageDefinition.ContentType = "text/html";
            pRequest.AllowCaching = tPageDefinition.BufferResponse;
            if (tPageDefinition.LastCacheWP!=null && tPageDefinition.LastCacheWP.ContainsKey(tWebPlatform) && !string.IsNullOrEmpty(tPageDefinition.LastCacheWP[tWebPlatform]) && 
                (tPageDefinition.CachePeriod == 0 || 
                (tPageDefinition.CachePeriod > 0 && DateTimeOffset.Now.Subtract(tPageDefinition.LastCacheTime).TotalSeconds < tPageDefinition.CachePeriod)) && 
                !tPageDefinition.RequireLogin && !tPageDefinition.LastCacheWP[tWebPlatform].StartsWith("<html><h1>Fatal"))
            {
                pRequest.ResponseBuffer = TheCommonUtils.CUTF8String2Array(tPageDefinition.LastCacheWP[tWebPlatform]);
                pRequest.ResponseMimeType = tPageDefinition.ContentType;
                pRequest.AllowStatePush = true;
                pRequest.StatusCode = 200;
                TheNMIEngine.SetScopeID(pRequest, tPageDefinition);
                TheNMIEngine.PageHitCounter(tPageDefinition, true);
                return;
            }

            if (tPageDefinition.RequireLogin && !TheUserManager.IsInitialized())
            {
                ReturnNotInit(pRequest);
                return;
            }

            string CompositeHTML = "";
            try
            {
                if (string.IsNullOrEmpty(tPageDefinition.AdminRole))
                    tPageDefinition.AdminRole = "NMIADMIN";

                string txtMainTemplate = GeneratePage(ReadTemplate(tPageDefinition.PageTemplate));
                string txtContent = "";
                if (tPageDefinition.ContentID != Guid.Empty)
                {
                    List<ThePageContent> tContent = TheNMIEngine.GetPageContentByID(tPageDefinition.ContentID); 
                    foreach (ThePageContent tContentDef in tContent)
                        txtContent += ReadPageBlock(tContentDef.WBID);
                    if (string.IsNullOrEmpty(txtMainTemplate))
                        txtMainTemplate = txtContent;
                    else
                    {
                        if (!txtMainTemplate.Contains("<%PAGE_CONTENT%>"))
                            txtMainTemplate += txtContent;
                        else
                            txtMainTemplate = txtMainTemplate.Replace("<%PAGE_CONTENT%>", txtContent);
                    }
                }
                if (tPageDefinition.ContentID2 != Guid.Empty)
                {
                    txtContent = "";
                    List<ThePageContent> tContent = TheNMIEngine.GetPageContentByID(tPageDefinition.ContentID2); 
                    foreach (ThePageContent tContentDef in tContent)
                        txtContent += ReadPageBlock(tContentDef.WBID);
                    txtMainTemplate = string.IsNullOrEmpty(txtMainTemplate) ? txtContent : txtMainTemplate.Replace("<%PAGE_CONTENT2%>", txtContent);
                }
                if (!string.IsNullOrEmpty(pMainFrameHtml) && !tPageDefinition.BrandPage)
                    CompositeHTML = TheCommonUtils.GenerateFinalStr(pMainFrameHtml.Replace("<%PAGE_MAINCONTENT%>", txtMainTemplate).Replace("<%PAGE_TITLE%>", tPageDefinition.Title).Replace("<%PAGE_URL%>", pRealPage));
                else
                    CompositeHTML = TheCommonUtils.GenerateFinalStr(txtMainTemplate.Replace("<%PAGE_TITLE%>", tPageDefinition.Title).Replace("<%PAGE_URL%>", pRealPage));
            }
            catch (Exception e)
            {
                TheBaseAssets.MySYSLOG.WriteToLog(404, new TSM(MyBaseEngine.GetEngineName(), "Fatal Error during Page Load during loading of PAGE:" + pRealPage, eMsgLevel.l1_Error, e.ToString()));
                CompositeHTML = "<html><h1>Fatal Error during load or Page " + pRealPage + ":</h1><p>" + e + "</p></html>";
                if (TheNMIEngine.IsPageStoreReady())
                    TheNMIEngine.PageHitCounter(tPageDefinition, false);
                pRequest.ResponseBuffer = TheCommonUtils.CUTF8String2Array(CompositeHTML);
                pRequest.ResponseMimeType = "text/html";
                pRequest.AllowStatePush = true;
                pRequest.StatusCode = 200;
                return;
            }
            if (TheNMIEngine.IsPageStoreReady())
                TheNMIEngine.PageHitCounter(tPageDefinition, true);

            int tAppPos;
            do
            {
                tAppPos = CompositeHTML.IndexOf("%PBLOCK:", StringComparison.Ordinal);
                if (tAppPos >= 0)
                {
                    int tAppPosEnd = CompositeHTML.IndexOf("%", tAppPos + 8, StringComparison.Ordinal);
                    if (tAppPosEnd >= 0)
                    {
                        string tAppString = CompositeHTML.Substring(tAppPos + 8, tAppPosEnd - (tAppPos + 8));
                        string tIns = TheCommonUtils.GenerateFinalStr(ReadPageBlock(TheCommonUtils.CGuid(tAppString)).Replace("<%PAGE_TITLE%>", tPageDefinition.Title).Replace("<%PAGE_URL%>", pRealPage));
                        CompositeHTML = CompositeHTML.Replace("%PBLOCK:" + tAppString + "%", tIns);
                    }
                }
            } while (tAppPos >= 0);

            if (TheNMIEngine.IsPageStoreReady())
                CompositeHTML = CompositeHTML.Replace("<%POWERED_BY%>", "- Powered by the C-DEngine.web");
            else
                CompositeHTML = CompositeHTML.Replace("<%POWERED_BY%>", "");

            CompositeHTML = CreateHeader(pRequest, pRealPage, CompositeHTML, tWebPlatform, tPageDefinition, false, tPageDefinition.IsLiteTheme);
            if (tPageDefinition.IncludeCDE)
            {
                if (TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("NMIDebugDiv")))
                    CompositeHTML += "<div id=\"cdeLogView\" style=\"color: cadetblue; \"></div>";
                CompositeHTML += "</body>";
            }
            if (!CompositeHTML.EndsWith("</HTML>", StringComparison.CurrentCultureIgnoreCase))
                CompositeHTML += "</HTML>";
            if (!tPageDefinition.IsNotCached)
            {
                if (tPageDefinition.LastCacheWP == null)
                    tPageDefinition.LastCacheWP = new cdeConcurrentDictionary<eWebPlatform, string>();
                tPageDefinition.LastCacheWP[tWebPlatform] = CompositeHTML;
                tPageDefinition.LastCacheTime = DateTimeOffset.Now;
            }

            TheNMIEngine.SetScopeID(pRequest, tPageDefinition);
            pRequest.ResponseBuffer = TheCommonUtils.CUTF8String2Array(CompositeHTML);
            pRequest.StatusCode = 200;
            pRequest.ResponseMimeType = tPageDefinition.ContentType;
            pRequest.AllowStatePush = true;
        }

        private static void ReturnNotInit(TheRequestData pRequest)
        {
            pRequest.ResponseBuffer = TheCommonUtils.CUTF8String2Array("...not initialized, yet, try again in a couple seconds...");
            pRequest.ResponseMimeType = "text/html";
            pRequest.AllowStatePush = true;
            pRequest.StatusCode = 200;
        }





        private string ReadPageBlock(Guid pBlockId)
        {
            string txtBlock = "";
            ThePageBlocks tBlock = TheNMIEngine.GetBlockByID(pBlockId);
            if (tBlock != null)
            {
                string bID = tBlock.BlockType.ToString();
                switch (bID)
                {
                    case "e5cc2d30-61ea-45b8-835e-e309df82c2c4": //JAVASCRIPT
                        txtBlock = "<script type='text/javascript'>";
                        txtBlock += ReadTemplate(tBlock.Template);
                        if (!string.IsNullOrEmpty(tBlock.RawData))
                            txtBlock += tBlock.RawData;
                        txtBlock += "</script>";
                        break;
                    case "06a18ef9-9543-4204-bc28-56956bb7c482": //STYLESHEET
                        txtBlock = "<style type='text/css'>";
                        txtBlock += ReadTemplate(tBlock.Template);
                        if (!string.IsNullOrEmpty(tBlock.RawData))
                            txtBlock += tBlock.RawData;
                        txtBlock += "</style>";
                        break;
                    case "779699eb-2ae9-4ee2-8095-f4bd4a309358":    //CONTENT
                        Guid tContentGuid = new Guid(tBlock.Template);
                        if (tContentGuid != Guid.Empty)
                        {
                            List<ThePageContent> tContent = TheNMIEngine.GetPageContentByID(tContentGuid);
                            foreach (ThePageContent tContentDef in tContent)
                                txtBlock += ReadPageBlock(tContentDef.WBID);
                        }
                        break;
                    case "3f2d0ad5-9d18-49c5-a6e2-04be7f10bd89":    //HTML
                        txtBlock = ReadTemplate(tBlock.Template);
                        string tHead = "";
                        if (!string.IsNullOrEmpty(tBlock.ImgLink))
                        {
                            if (tBlock.ImgHeight == 0) tBlock.ImgHeight = 160;
                            tHead = "<tr><td colspan=\"4\" style=\"height: " + tBlock.ImgHeight + "px; background-image: url('" + tBlock.ImgLink + "');\">";
                            tHead += "<h1 class=\"MyHeadlineFont\" style=\"vertical-align: middle; text-align: center;  font-weight:bold;\">" + tBlock.Headline + "</h1></td></tr>";
                        }
                        else
                        {
                            tHead = "<tr><td style=\"height: 50px\" colspan=\"4\"><img src=\"Images/e.png\" height=\"50\" alt=\"0\" /></td></tr>";
                            tHead += "<tr><td style=\"width: 50px\"><img src=\"Images/e.png\" width=\"50\" alt=\"0\" /></td><td colspan=\"3\">";
                            tHead += "<h1 class=\"MyHeadlineFont\">" + tBlock.Headline + "</h1></td></tr>";
                        }
                        txtBlock = txtBlock.Replace("<%PABLOCK_HEADLINE%>", tHead);
                        if (!string.IsNullOrEmpty(tBlock.RawData))
                        {
                            txtBlock = string.IsNullOrEmpty(txtBlock) ? tBlock.RawData : txtBlock.Replace("<%PABLOCK_RAWDATA%>", tBlock.RawData);
                        }
                        break;
                    case "4ef9b2cb-5d6d-471c-a164-4b3f026e9a8c":    //SIDEBLOCK
                        txtBlock = ReadTemplate(tBlock.Template).Replace("<%BLOCK_HEADER%>", tBlock.Headline);
                        if (!string.IsNullOrEmpty(tBlock.Bullets))
                        {
                            string tBody = "<tr><td class=\"MyContentFont\" style=\"text-align: center;\">";
                            tBody += tBlock.Bullets;
                            tBody += "</td></tr>";
                            txtBlock = txtBlock.Replace("<%BLOCK_BODY%>", tBody);
                        }
                        else
                            txtBlock = txtBlock.Replace("<%BLOCK_BODY%>", "");
                        if (!string.IsNullOrEmpty(tBlock.ClickInfo))
                        {
                            string tClickInfo = "<tr><td class=\"MyLinkFont\" style=\"vertical-align: bottom; text-align: right;\">";
                            tClickInfo += tBlock.ClickInfo;
                            tClickInfo += "</td></tr>";
                            txtBlock = txtBlock.Replace("<%CLICKINFO%>", tClickInfo);
                        }
                        else
                            txtBlock = txtBlock.Replace("<%CLICKINFO%>", "");
                        txtBlock = string.IsNullOrEmpty(tBlock.ClickLink) ? txtBlock.Replace("<%CLICKLINK%>", "\"") : txtBlock.Replace("<%CLICKLINK%>", "cursor: pointer;\" onclick=\"document.location='" + tBlock.ClickLink + "'\"");
                        break;
                    case "e02cb607-bcc6-439d-b0c4-f69b10982e39":    //BULLETS
                        txtBlock = ReadTemplate(tBlock.Template).Replace("<%BLOCK_HEADER%>", tBlock.Headline);
                        if (string.IsNullOrEmpty(tBlock.ImgLink))
                            txtBlock = txtBlock.Replace("<%IMGLINK%>", "<td rowspan=\"3\" colspan=\"2\"/>");
                        else
                        {
                            string tImg = "<td rowspan=\"3\"";
                            if (tBlock.ImgWidth > 0)
                                tImg += " style=\"width: " + tBlock.ImgWidth + "px; vertical-align: top;\"";
                            tImg += "><img src=\"" + tBlock.ImgLink + "\"";
                            if (tBlock.ImgHeight > 0)
                                tImg += " height=\"" + tBlock.ImgHeight + "\"";
                            if (tBlock.ImgWidth > 0)
                                tImg += " width=\"" + tBlock.ImgWidth + "\"";
                            tImg += " alt=\"0\" /></td><td rowspan=\"3\" style=\"width: 20px\"><img src=\"Images/e.png\" width=\"20\" alt=\"0\" /></td>";
                            txtBlock = txtBlock.Replace("<%IMGLINK%>", tImg);
                        }
                        string[] tBulls = tBlock.Bullets.Split(';');
                        string tBulletText = "";
                        if (tBulls.Length > 0)
                        {
                            tBulletText = "<ul>";
                            foreach (string tBull in tBulls)
                            {
                                if (tBlock.AddBullets)
                                    tBulletText += "<li>";
                                tBulletText += tBull;
                                if (tBlock.AddBullets)
                                    tBulletText += "</li>";
                                else
                                    tBulletText += "<br/>";
                            }
                            tBulletText += "</ul>";
                        }
                        txtBlock = string.IsNullOrEmpty(tBulletText) ? txtBlock.Replace("<%BULLETS%>", "") : txtBlock.Replace("<%BULLETS%>", "<tr><td class=\"MyBulletFont\">" + tBulletText + "</td></tr>");
                        txtBlock = txtBlock.Replace("<%TOUCHFRAME%>", !tBlock.ShowTouchFrame ? "" : "background-image: url('Images/glasOverlay.png'); background-size:100% 100%;  background-repeat: repeat;");
                        txtBlock = string.IsNullOrEmpty(tBlock.ClickLink) ? txtBlock.Replace("<%CLICKLINK%>", "\"") : txtBlock.Replace("<%CLICKLINK%>", "cursor: pointer;\" onclick=\"document.location='" + tBlock.ClickLink + "'\"");
                        txtBlock = string.IsNullOrEmpty(tBlock.ClickInfo) ? txtBlock.Replace("<%CLICKINFO%>", "") : txtBlock.Replace("<%CLICKINFO%>", "<tr><td class=\"MyBulletLink\">...Click here to learn more about " + tBlock.ClickInfo + "</td></tr>");
                        break;
                }
            }
            return GeneratePage(txtBlock);
        }

        private string ReadTemplate(string pPageTemplate)
        {
            if (string.IsNullOrEmpty(pPageTemplate)) return "";
            if (pPageTemplate.IndexOf('.') < 0)
                pPageTemplate += ".html";
            string tTemplate = TheCommonUtils.CArray2UTF8String(TheCommonUtils.GetSystemResource(null, pPageTemplate));
            if (string.IsNullOrEmpty(tTemplate))
                tTemplate = "";
            return tTemplate;
        }



        /// <summary>
        /// Generates a page from an incoming string
        /// </summary>
        /// <param name="gfsinStr"></param>
        /// <returns></returns>
        public string GeneratePage(string gfsinStr)
        {

            if (string.IsNullOrEmpty(gfsinStr)) return "";
            if (gfsinStr.IndexOf("<%", StringComparison.Ordinal) < 0) return gfsinStr;
#if JCDEBUG
			ProfilerString=UpdateProfile(ProfilerString,"GenerateFinalStr (MAINMACROS) enter",ProfileTimer);
#endif
            int tT = 1;
            string gfsoutStr1 = "";

            gfsoutStr1 = gfsinStr;
            while (tT == 1)
            {
                var gfsoutStr = gfsoutStr1;
                if (gfsoutStr.IndexOf("<%", StringComparison.Ordinal) < 0) break; // 3 Recursions allowed then out...

                var tAppPos = gfsoutStr.IndexOf("<%WABLOCK:", StringComparison.Ordinal);
                if (tAppPos >= 0)
                {
                    var tAppPosEnd = gfsoutStr.IndexOf("%>", tAppPos + 10, StringComparison.Ordinal);
                    if (tAppPosEnd >= 0)
                    {
                        var tAppString = gfsoutStr.Substring(tAppPos + 10, tAppPosEnd - (tAppPos + 10));
                        gfsoutStr = gfsoutStr.Replace("<%WABLOCK:" + tAppString + "%>", ReadPageBlock(new Guid(tAppString)));
                    }
                }
                if (gfsoutStr != gfsoutStr1) gfsoutStr1 = gfsoutStr; else tT = 0;
            }
            return gfsoutStr1;
        }

        #endregion

        #region Header and Footer

        private static string CreateHeader(TheRequestData pRequest, string pRealPage, string pComposite, eWebPlatform pWebPlatform, ThePageDefinition pPage, bool IsDebugEnabled, bool IsLite)
        {
            StringBuilder tStr = new StringBuilder();
            tStr.Append("<!DOCTYPE html><html><head>");
            tStr.Append("<meta content=\"en-us\" http-equiv=\"Content-Language\" /><meta charset=\"UTF-8\"> ");
            tStr.Append("<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" >");
            string tPlat = "W";
            //if (pWebPlatform > 0)
            {
                if (string.IsNullOrEmpty(PageScale))
                {
                    PageScale = TheBaseAssets.MySettings.GetSetting("PageScale");
                    if (string.IsNullOrEmpty(PageScale))
                        PageScale = "1.0;0.5;1.0;0.5;1.0;1.0;0.5;0.5;1.0";
                    PlatformScale = PageScale.Split(';');
                }
                string tScale = "1.0";
                if (PlatformScale?.Length > (int)pWebPlatform) tScale = PlatformScale[(int)pWebPlatform];
                switch (pWebPlatform)
                {
                    case eWebPlatform.Mobile: tPlat = "P"; break;
                    case eWebPlatform.HoloLens: tPlat = "H"; break;
                    case eWebPlatform.XBox: tPlat = "X"; break;
                    case eWebPlatform.TeslaXS: tPlat = "T"; break;
                    case eWebPlatform.TizenFamilyHub: tPlat = "FH"; break;
                    case eWebPlatform.TizenTV: tPlat = "TY"; break;
                    case eWebPlatform.Bot: tPlat =null; break;
                    default:
                        break;
                }
                tStr.Append($"<meta name=\"viewport\" content=\"width=device-width, initial-scale={tScale}, maximum-scale={tScale}\">");
            }

            if (pPage.IncludeCDE)
            {
                tStr.Append("<meta http-equiv=\"Expires\" content=\"0\" />");
                tStr.Append("<meta http-equiv=\"Cache-Control\" content=\"no-cache\" />");
                tStr.Append("<meta http-equiv=\"Pragma\" content=\"no-cache\" />");
            }
            if (!string.IsNullOrEmpty(pPage.AddHeader))
                tStr.Append(pPage.AddHeader);
            if (!string.IsNullOrEmpty(pPage.Title) && pComposite.IndexOf("<title>", StringComparison.OrdinalIgnoreCase) < 0)
                tStr.Append("<title>" + pPage.Title + "</title>");
            if (pWebPlatform== eWebPlatform.Bot)
            {
                tStr.Append("</head><body class=\"cdeBody\">");
                return tStr.ToString();
            }
            if (pPage.IncludeCDE)
            {
                if (!TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("DisableNMIStyles")))
                {
                    tStr.Append("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/flatpickr.dark.css\" type=\"text/css\" cde=\"colorScheme\" dark=\"css/flatpickr.dark.css\" lite=\"css/flatpickr.lite.css\">");
                    tStr.Append("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/choices.dark.min.css\" type=\"text/css\" cde=\"colorScheme\" dark=\"css/choices.dark.min.css\" lite=\"css/choices.lite.min.css\">");

                    tStr.Append("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/all.min.css\" />");
                    tStr.Append("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/cdeStyles.min.css\" />");
                    tStr.Append($"<link rel=\"stylesheet\" type=\"text/css\" cde=\"colorScheme\" href=\"css/{(IsLite ? "L" : "")}cdeBaseColors.min.css\" lite=\"css/LcdeBaseColors.min.css\" dark=\"css/cdeBaseColors.min.css\"  id=\"basecolorstyle\" />");
                    tStr.Append($"<link rel=\"stylesheet\" type=\"text/css\" cde=\"colorScheme\" href=\"css/{(IsLite ? "L" : "")}BaseColors.min.css\" lite=\"css/LBaseColors.min.css\" dark=\"css/BaseColors.min.css\"  id=\"basecolorstyle\" />");
                    tStr.Append("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/mystyles" + tPlat + ".min.css\" />");
                    if (pWebPlatform == 0)
                        tStr.Append("<link media=\"only screen and (min-width: 1025px)\" rel=\"stylesheet\" type=\"text/css\"  href=\"css/mystylesl.min.css\" />");
                    tStr.Append("<link rel=\"stylesheet\" type=\"text/css\" href=\"css/mystyles.min.css\" />");
                }
                tStr.Append("<script type=\"text/javascript\" src=\"js/choices.min.js\"></script>");
                tStr.Append("<script type=\"text/javascript\" src=\"js/flatpickr.js\"></script>");
                tStr.Append("<script type=\"text/javascript\" src=\"js/flatpickr.monthSelect.js\"></script>");
                tStr.Append("<script type=\"text/javascript\" src=\"js/moment-with-locales.min.js\"></script>");
                tStr.Append("<script type=\"text/javascript\" src=\"js/jdenticon-2.2.0.min.js\"></script>");
                tStr.Append("<script type=\"text/javascript\" src=\"cde/cde.js\"></script>");
                tStr.Append("<script type=\"text/javascript\" src=\"js/cdeNMITransForms.js\"></script>");

                foreach (string tScript in TheCommCore.MyHttpService.GetGlobalScripts())
                    tStr.Append($"<script type=\"text/javascript\" src=\"{tScript}\"></script>");

                tStr.Append("<script type=\"text/javascript\">");
                tStr.Append("document.addEventListener('DOMContentLoaded', function() {");
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.IsUsingUserMapper={TheBaseAssets.MyServiceHostInfo.IsUsingUserMapper.ToString().ToLower()};");
                string tPortalScreen = "";
                string tStartScreen = "";
                if (!TheBaseAssets.MyServiceHostInfo.IsCloudService) 
                {
                    //new in 5.142.1: If AutoLoginUID is set with a valid UID, this user is logged in automatically.
                    var tAutoLoginGuid = TheBaseAssets.MySettings.GetSetting("AutoLoginUID");
                    if (!string.IsNullOrEmpty(tAutoLoginGuid))
                        pRequest.SessionState.CID = TheCommonUtils.CGuid(tAutoLoginGuid);
                }
                if (pPage.RequireLogin && TheUserManager.HasSessionValidUser(pRequest?.SessionState))
                {
                    var tConnect = TheUserManager.GetUserDataForNMI(pRequest?.SessionState);
                    if (tConnect != null)
                    {
                        tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.UToken='{tConnect.PWD}';");
                        tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.CurrentLCID={tConnect.LCI};");
                        tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.InitUserPref=\"{TheCommonUtils.cdeJavaEncode4Code(tConnect.UPRE)}\";");
                        if (!string.IsNullOrEmpty(tConnect.PS))
                            tPortalScreen = tConnect.PS;
                        if (!string.IsNullOrEmpty(tConnect.SSC))
                            tStartScreen = tConnect.SSC;
                    }
                }
                //TODO: Coming from Preferences:
                string ScreenTemplate = "TemplateThing12x10";
                bool ShowClassic = false;
                bool RedPill = TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("RedPill"));
                int debugLevel = 0;

                if (debugLevel>3)
                    tStr.Append($"debugger;");

                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.AutoConnectRelay='INCDE';");
                if (TheUserManager.DoesAdminRequirePWD(pPage.AdminRole) && TheScopeManager.GetScrambledScopeID()!="")
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.LoginDisallowed={true.ToString().ToLower()};");
                else
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.AdminPWMustBeSet={ TheUserManager.DoesAdminRequirePWD(pPage.AdminRole).ToString().ToLower()};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.DoesRequireConfiguration={TheBaseAssets.MyServiceHostInfo.RequiresConfiguration.ToString().ToLower()};");
                //tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.FirstNodeID='{TheBaseAssets.MyServiceHostInfo.MyDeviceInfo.DeviceID}';");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.IsWSHBDisabled={TheBaseAssets.MyServiceHostInfo.IsWSHBDisabled.ToString().ToLower()};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.WebPlatform={((int)pWebPlatform)};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.ScreenClassName='{ScreenTemplate}';");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.ShowClassic={ShowClassic.ToString().ToLower()};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.RedPill={RedPill.ToString().ToLower()};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.DebugLevel={debugLevel};");
                if (TheBaseAssets.MySettings.HasSetting("ShowLogInConsole"))
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.ShowLogInConsole={TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("ShowLogInConsole")).ToString().ToLower()};");
                if (TheBaseAssets.MySettings.HasSetting("DisableWebWorker"))
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.DisableWebWorker={TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("DisableWebWorker")).ToString().ToLower()};");
                if (TheBaseAssets.MySettings.HasSetting("RequestGeoLocation"))
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.RequestGeoLocation={TheCommonUtils.CBool(TheBaseAssets.MySettings.GetSetting("RequestGeoLocation")).ToString().ToLower()};");
                if (!string.IsNullOrEmpty(pRequest?.SessionState?.TETO))
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.EnablePinLogin=true;");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.ResourcePath='{TheBaseAssets.MyServiceHostInfo.ResourcePath}';");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.HideHeader={(!pPage.IncludeHeaderButtons).ToString().ToLower()};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.DoAllowAnonymous={(pPage.IsPublic || TheBaseAssets.MyServiceHostInfo.AllowAnonymousAccess).ToString().ToLower()};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.AllowSetScopeWithSetAdmin={TheBaseAssets.MyServiceHostInfo.AllowSetScopeWithSetAdmin.ToString().ToLower()};");
                
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.HasInternetAccess={TheBaseAssets.MyServiceHostInfo.HasInternetAccess.ToString().ToLower()};");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.MainConfigScreen='{TheBaseAssets.MyServiceHostInfo.MainConfigScreen}';");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.WsTimeOut={TheBaseAssets.MyServiceHostInfo.TO.WsTimeOut};");
                switch (pWebPlatform)
                {
                    case eWebPlatform.TeslaXS:
                        tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.TileSize=90;");
                        tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.TileScale = 90.0 / 78.0;");
                        tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.InputSize = 70.0;");
                        break;
                    case eWebPlatform.Mobile:
                    case eWebPlatform.HoloLens:
                        tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.TileSize=70;");
                        tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.TileScale = 70.0 / 78.0;");
                        tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.InputSize = 50.0;");
                        break;
                }
                if (TheBaseAssets.MyServiceHostInfo.DisableRSAToBrowser)
                    tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.DisableRSA=true;");
                Uri tStationUri = new Uri(TheBaseAssets.MyServiceHostInfo.GetPrimaryStationURL(false));
                bool Found = false;
                if (pRequest != null && TheBaseAssets.MyServiceHostInfo.MyAltStationURLs.Count > 0 && !pRequest.RequestUri.Host.Equals(tStationUri.Host))
                {
                    foreach (string tU in TheBaseAssets.MyServiceHostInfo.MyAltStationURLs)
                    {
                        if (tU.StartsWith("CDE")) continue;
                        tStationUri = new Uri(tU);
                        if (pRequest.RequestUri.Host.Equals(tStationUri.Host))
                        {
                            Found = true;
                            break;
                        }
                    }
                }
                if (!Found)
                {
                    if (pRequest != null && TheBaseAssets.MyServiceHostInfo.AllowLocalHost)
                        tStationUri = pRequest.RequestUri;
                    else
                        tStationUri = new Uri(TheBaseAssets.MyServiceHostInfo.GetPrimaryStationURL(false));
                }
#if CDE_NET35
                tStationUri = TheCommonUtils.CUri(tStationUri, false);
#endif
                if (TheBaseAssets.MySettings.HasSetting("BrowserReconnectUrl"))
                    tStationUri = new Uri(TheBaseAssets.MySettings.GetSetting("BrowserReconnectUrl"));
                tStr.Append($"cde.MyBaseAssets.MyCommStatus.MyServiceUrl='{tStationUri.Scheme}://{tStationUri.Host}:{tStationUri.Port}';");
                if (TheBaseAssets.MyServiceHostInfo.MyStationWSPort > 0 && !TheBaseAssets.MyServiceHostInfo.DisableWebSockets)
                {
                    if (TheBaseAssets.MySettings.HasSetting("BrowserReconnectUrl"))
                        tStationUri = tStationUri.SetWSInfo(tStationUri.Port, "");
                    else
                        tStationUri = tStationUri.SetWSInfo(TheBaseAssets.MyServiceHostInfo.MyStationWSPort, "");
                    TheBaseAssets.MySYSLOG.WriteToLog(404, TSM.L(eDEBUG_LEVELS.VERBOSE) ? null : new TSM("HTML5Insert", $"Setting MyWsServiceURL={tStationUri} MSWSP:{TheBaseAssets.MyServiceHostInfo.MyStationWSPort}", eMsgLevel.l3_ImportantMessage));
                    tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.MyWSServiceUrl='{tStationUri.Scheme}://{tStationUri.Host}:{tStationUri.Port}';");
                }

                tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme=" + IsLite.ToString().ToLower() + ";");
                tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.AdminRole='" + TheCommonUtils.cdeJavaEncode(pPage.AdminRole) + "';");
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.PortalPage = 'cdeclean.aspx?{TheCommonUtils.cdeJavaEncode(TheBaseAssets.MyServiceHostInfo.RootDir + pRealPage)}{pRequest.RequestUri.Query}';");
                if (string.IsNullOrEmpty(tPortalScreen) && pPage.PortalGuid != Guid.Empty)
                    tPortalScreen = pPage.PortalGuid.ToString();
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.PortalScreen = '{tPortalScreen}';");
                tStr.Append("cde.MyBaseAssets.MyServiceHostInfo.ApplicationTitle= '" + TheCommonUtils.cdeJavaEncode(pPage.Title) + "';");
                if (string.IsNullOrEmpty(tStartScreen) && pPage.StartScreen != Guid.Empty)
                    tStartScreen = pPage.StartScreen.ToString();
                tStr.Append($"cde.MyBaseAssets.MyServiceHostInfo.StartScreen= '{tStartScreen}';");
                tStr.Append("cdeNMI.StartupNMI(); });");
                tStr.Append("</script>");
            }
            if (IsDebugEnabled)
                tStr.Append("<script src=\"http://ie.microsoft.com/testdrive/HTML5/CompatInspector/inspector.js\"></script>");
            if (TheBaseAssets.MyServiceHostInfo.AzureAnalytics != Guid.Empty)
                tStr.Append(InsertAzureAnalytics());
            if (pPage.IncludeCDE)
                tStr.Append("</head><body class=\"cdeBody\">");
            else
                tStr.Append(pComposite.Replace("<%=DASHBOARD%>", ""));
            return tStr.ToString();
        }

        private static string InsertAzureAnalytics()
        {
            StringBuilder tStr = new StringBuilder();
            tStr.Append("<script type=\"text/javascript\">");
            tStr.Append("window.appInsights={queue:[],applicationInsightsId:null,accountId:null,appUserId:null,configUrl:null,start:function(n){function u(n){t[n]=function(){var i=arguments;t.queue.push(function(){t[n].apply(t,i)})}}function f(n,t){if(n){var u=r.createElement(i);u.type=\"text/javascript\";u.src=n;u.async=!0;u.onload=t;u.onerror=t;r.getElementsByTagName(i)[0].parentNode.appendChild(u)}else t()}var r=document,t=this,i;t.applicationInsightsId=n;u(\"logEvent\");u(\"logPageView\");i=\"script\";f(t.configUrl,function(){f(\"//az416426.vo.msecnd.net/scripts/a/ai.0.7.js\")});t.start=function(){}}};");
            tStr.Append($"appInsights.start(\"{TheBaseAssets.MyServiceHostInfo.AzureAnalytics}\");appInsights.logPageView();</script>");
            return tStr.ToString();
        }
        #endregion
    }
}
