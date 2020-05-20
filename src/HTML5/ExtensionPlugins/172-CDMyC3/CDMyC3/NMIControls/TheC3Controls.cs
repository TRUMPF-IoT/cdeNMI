// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

using nsCDEngine.Engines.NMIService;
using nsCDEngine.ViewModels;
using System;

namespace CDMyC3
{
    public partial class ctrlC3Chart : TheNMIBaseControl
    {
        /// <summary>
        /// Default Value: transparent
        /// </summary>
        public string Background { get; set; }

        public string Title { get; set; }

        public string SetSeries { get; set; }

        public string ChartColors { get; set; }

        public string ChartType { get; set; }

        public string Groups { get; set; }

        public bool UpdateData { get; set; }

        public double MaxValue { get; set; }


        public override string EngineName => "CDMyC3.TheC3Service";

        public override string ControlType => "CDMyC3.ctrlC3Chart";
    }

    public partial class ctrlTeslaSpeedometer : TheNMIBaseControl
    {
        public override string EngineName => "CDMyC3.TheC3Service";

        public override string ControlType => "CDMyC3.ctrlTeslaSpeedometer";

        public int Power { get; set; }

        public int Gear { get; set; }

        public int MaxValue { get; set; }
    }

    public partial class ctrlTimeLineChart : TheNMIBaseControl
    {
        public override string EngineName => "CDMyC3.TheC3Service";

        public override string ControlType => "CDMyC3.ctrlTimeLineChart";

        public bool DrawRightToLeft { get; set; }

        public string ChartColors { get; set; }

        public int Hours { get; set; }
    }

    public class TheMachineStateHistory : TheDataBase
    {
        public DateTimeOffset StateChangeTime { get; set; }
        public int State { get; set; }
        public Guid SensorMID { get; set; }
        public string SensorValue { get; set; }
    }
}
