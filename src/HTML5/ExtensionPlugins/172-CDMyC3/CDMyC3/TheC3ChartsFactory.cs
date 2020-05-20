// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

using nsCDEngine.BaseClasses;
using nsCDEngine.Communication;
using nsCDEngine.Engines.NMIService;
using nsCDEngine.ViewModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace CDMyC3
{
    public class TheC3ChartsFactory : ICDEChartsFactory
    {
        public class DataOptions
        {
            public string x { get; set; } = "x";
            public string xFormat { get; set; } = "%Y-%m-%d %H:%M:%S";
        }

        public class Chart
        {
            public Axis axis { get; set; }
            public DataOptions data { get; set; }

        }

        public class Tick
        {
            public string format { get; set; } = "%Y-%m-%d %H:%M:%S";
        }

        public class Axis
        {
            public Tick tick { get; set; }
            public string type { get; set; }
        }

        public class TheC3Charts
        {
            public Chart chart { get; set; }
            public List<DateTimeOffset> timeseries { get; set; }
            public Dictionary<int, List<double>> dataseries { get; set; }
            public TheChartDefinition ChartDef;

            public TheC3Charts()
            {
                chart = new Chart();
                dataseries = new Dictionary<int, List<double>>();
                timeseries = new List<DateTimeOffset>();
            }
        }



        public void CreateChartInfo(TheChartDefinition pDef, string pZoomType, string xAxisType)
        {
            Reset();
            SetInfo(pDef, pZoomType, xAxisType);
        }

        public void SetInfo(TheChartDefinition pDef, string pZoomType, string xAxisType)
        {
            mChart.ChartDef = pDef;
            for (int i = 0; i < mChart.ChartDef.ValueDefinitions.Count; i++)
                mChart.dataseries[i] = new List<double>();
        }

        public bool AddChartData(TheChartData pData)
        {
            mChart.timeseries.Add(pData.TimeStamp);
            for (int i=0; i<pData.MyValue.Length;i++)
            {
                if (mChart.dataseries.ContainsKey(i))
                    mChart.dataseries[i].Add(pData.MyValue[i]);
            }
            return true;
        }

        public bool PushChartData(Guid ChartInfo, Guid Org, string IChartFactory = null)
        {
            Type td = typeof(CDMyC3.TheC3ChartsFactory);
            return TheChartFactory.PushChartsData(ChartInfo, Org, td.AssemblyQualifiedName);
        }

        private readonly object mChartLock = new object();
        TheC3Charts mChart;
        private string SerializeChart2JSON()
        {
            StringBuilder tStr = new StringBuilder();
            lock (mChartLock)
            {
                tStr.Append("[[\"x\" ");
                foreach (var t in mChart.timeseries)
                    tStr.Append($", \"{t.Year}-{t.Month}-{t.Day} {t.Hour}:{t.Minute}:{t.Second}\"");
                tStr.Append("]");
                for (int i = 0; i < mChart.dataseries.Count; i++)
                {
                    tStr.Append($",[\"{mChart.ChartDef.ValueDefinitions[i].Label}\"");
                    foreach (var t in mChart.dataseries[i])
                    {
                        tStr.Append($",{t}");
                    }
                    tStr.Append("]");
                }
                tStr.Append("]");
            }
            return tStr.ToString();
        }

        public void SendChartData(TheDataBase pTarget)
        {
            string tStr = SerializeChart2JSON();
            if (pTarget.cdeN == Guid.Empty)
                TheCommCore.PublishCentral(new TSM("CDMyC3.TheC3Service", $"CHART_MODEL:{pTarget.cdeMID}", tStr));
            else
                TheCommCore.PublishToNode(pTarget.cdeN, new TSM("CDMyC3.TheC3Service", $"CHART_MODEL:{pTarget.cdeMID}", tStr));
        }

        public void AddSeries(string pName)
        {
            //not needed
        }

        public bool AddPointToSeries(string pName, string pX, double point)
        {
            return true;
        }

        public TheC3ChartsFactory()
        {
            Reset();
        }

        public void Reset()
        {
            mChart = new TheC3Charts();
        }
    }

}
