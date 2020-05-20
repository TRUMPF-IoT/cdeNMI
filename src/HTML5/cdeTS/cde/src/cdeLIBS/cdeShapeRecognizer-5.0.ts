// SPDX-FileCopyrightText: Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
//
// SPDX-License-Identifier: BSD-3-Clause
//
//Author:
//      original code see below
//      ported to TypeScript and adopted by Chris Muench
//Language:
//      translated for NMI - verified
//      MyLogger events - must be translated in Log Receiver if required
//CSS Styles: none
//Dependencies:
//      cdeCore
//      cdeNMIModel
//      cdeNMIBaseControl
//Version History
//      4.109: Initial Drop


/**
* The $1 Unistroke Recognizer (JavaScript version)
*
*	Jacob O. Wobbrock, Ph.D.
* 	The Information School
*	University of Washington
*	Seattle, WA 98195-2840
*	wobbrock@uw.edu
*
*	Andrew D. Wilson, Ph.D.
*	Microsoft Research
*	One Microsoft Way
*	Redmond, WA 98052
*	awilson@microsoft.com
*
*	Yang Li, Ph.D.
*	Department of Computer Science and Engineering
* 	University of Washington
*	Seattle, WA 98195-2840
* 	yangli@cs.washington.edu
*
*
* The academic publication for the $1 recognizer, and what should be
* used to cite it, is:
*
*  Wobbrock, J.O., Wilson, A.D. and Li, Y. (2007). Gestures without
*	   libraries, toolkits or training: A $1 recognizer for user interface
*	   prototypes. Proceedings of the ACM Symposium on User Interface
*	   Software and Technology (UIST '07). Newport, Rhode Island (October
*	   7-10, 2007). New York: ACM Press, pp. 159-168.
*
* The Protractor enhancement was separately published by Yang Li and programmed
* here by Jacob O. Wobbrock:
*
*  Li, Y. (2010). Protractor: A fast and accurate gesture
*	  recognizer. Proceedings of the ACM Conference on Human
*	  Factors in Computing Systems (CHI '10). Atlanta, Georgia
*	  (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
*
* This software is distributed under the "New BSD License" agreement:
*
* Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
* All rights reserved. Last updated July 14, 2018.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*    * Redistributions of source code must retain the above copyright
*      notice, this list of conditions and the following disclaimer.
*    * Redistributions in binary form must reproduce the above copyright
*      notice, this list of conditions and the following disclaimer in the
*      documentation and/or other materials provided with the distribution.
*    * Neither the names of the University of Washington nor Microsoft,
*      nor the names of its contributors may be used to endorse or promote
*      products derived from this software without specific prior written
*      permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
* IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
* THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
* PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
* OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
* OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
* SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
* INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
* STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
* OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

namespace cdeNMI {
    //
    // Rectangle class
    //
    export class TheRectangle {
        X: number;
        Y: number;
        Width: number;
        Height: number;

        constructor(x, y, width, height) // constructor
        {
            this.X = x;
            this.Y = y;
            this.Width = width;
            this.Height = height;
        }
    }
    //
    // Unistroke class: a unistroke template
    //
    export class Unistroke {
        Points: TheDrawingPoint[];
        Vector;
        Name: string;

        constructor(pSR: TheShapeRecognizer, name, points) {
            this.Name = name;
            this.Points = pSR.Resample(points, pSR.NumPoints);
            const radians = pSR.IndicativeAngle(this.Points);
            this.Points = pSR.RotateBy(this.Points, -radians);
            this.Points = pSR.ScaleTo(this.Points, pSR.SquareSize);
            this.Points = pSR.TranslateTo(this.Points, pSR.Origin);
            this.Vector = pSR.Vectorize(this.Points); // for Protractor
        }
    }
    //
    // Result class
    //
    export class TheRecognizerResult {
        Name: string;
        Score: number;
        Time: number;

        constructor(name: string, score: number, ms: number) // constructor
        {
            this.Name = name;
            this.Score = score;
            this.Time = ms;
        }
    }

    //
    // DollarRecognizer class
    //
    export class TheShapeRecognizer extends cdeNMI.TheNMIBaseControl implements INMIShapeRecognizer {
        Unistrokes: Unistroke[];

        NumUnistrokes = 16;
        NumPoints = 64;
        SquareSize = 250.0;
        Origin = new TheDrawingPoint(0, 0);
        Diagonal = Math.sqrt(this.SquareSize * this.SquareSize + this.SquareSize * this.SquareSize);
        HalfDiagonal = 0.5 * this.Diagonal;
        AngleRange = this.Deg2Rad(45.0);
        AnglePrecision = this.Deg2Rad(2.0);
        Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio

        constructor() { // constructor
            super();
            this.MyBaseType = cdeControlType.ShapeRecognizer;
            //
            // one built-in unistroke per gesture type
            //
            this.Unistrokes = new Array(this.NumUnistrokes);
            this.Unistrokes[0] = new Unistroke(this, "triangle", [new TheDrawingPoint(137, 139), new TheDrawingPoint(135, 141), new TheDrawingPoint(133, 144), new TheDrawingPoint(132, 146), new TheDrawingPoint(130, 149), new TheDrawingPoint(128, 151), new TheDrawingPoint(126, 155), new TheDrawingPoint(123, 160), new TheDrawingPoint(120, 166), new TheDrawingPoint(116, 171), new TheDrawingPoint(112, 177), new TheDrawingPoint(107, 183), new TheDrawingPoint(102, 188), new TheDrawingPoint(100, 191), new TheDrawingPoint(95, 195), new TheDrawingPoint(90, 199), new TheDrawingPoint(86, 203), new TheDrawingPoint(82, 206), new TheDrawingPoint(80, 209), new TheDrawingPoint(75, 213), new TheDrawingPoint(73, 213), new TheDrawingPoint(70, 216), new TheDrawingPoint(67, 219), new TheDrawingPoint(64, 221), new TheDrawingPoint(61, 223), new TheDrawingPoint(60, 225), new TheDrawingPoint(62, 226), new TheDrawingPoint(65, 225), new TheDrawingPoint(67, 226), new TheDrawingPoint(74, 226), new TheDrawingPoint(77, 227), new TheDrawingPoint(85, 229), new TheDrawingPoint(91, 230), new TheDrawingPoint(99, 231), new TheDrawingPoint(108, 232), new TheDrawingPoint(116, 233), new TheDrawingPoint(125, 233), new TheDrawingPoint(134, 234), new TheDrawingPoint(145, 233), new TheDrawingPoint(153, 232), new TheDrawingPoint(160, 233), new TheDrawingPoint(170, 234), new TheDrawingPoint(177, 235), new TheDrawingPoint(179, 236), new TheDrawingPoint(186, 237), new TheDrawingPoint(193, 238), new TheDrawingPoint(198, 239), new TheDrawingPoint(200, 237), new TheDrawingPoint(202, 239), new TheDrawingPoint(204, 238), new TheDrawingPoint(206, 234), new TheDrawingPoint(205, 230), new TheDrawingPoint(202, 222), new TheDrawingPoint(197, 216), new TheDrawingPoint(192, 207), new TheDrawingPoint(186, 198), new TheDrawingPoint(179, 189), new TheDrawingPoint(174, 183), new TheDrawingPoint(170, 178), new TheDrawingPoint(164, 171), new TheDrawingPoint(161, 168), new TheDrawingPoint(154, 160), new TheDrawingPoint(148, 155), new TheDrawingPoint(143, 150), new TheDrawingPoint(138, 148), new TheDrawingPoint(136, 148)]);
            this.Unistrokes[1] = new Unistroke(this, "x", [new TheDrawingPoint(87, 142), new TheDrawingPoint(89, 145), new TheDrawingPoint(91, 148), new TheDrawingPoint(93, 151), new TheDrawingPoint(96, 155), new TheDrawingPoint(98, 157), new TheDrawingPoint(100, 160), new TheDrawingPoint(102, 162), new TheDrawingPoint(106, 167), new TheDrawingPoint(108, 169), new TheDrawingPoint(110, 171), new TheDrawingPoint(115, 177), new TheDrawingPoint(119, 183), new TheDrawingPoint(123, 189), new TheDrawingPoint(127, 193), new TheDrawingPoint(129, 196), new TheDrawingPoint(133, 200), new TheDrawingPoint(137, 206), new TheDrawingPoint(140, 209), new TheDrawingPoint(143, 212), new TheDrawingPoint(146, 215), new TheDrawingPoint(151, 220), new TheDrawingPoint(153, 222), new TheDrawingPoint(155, 223), new TheDrawingPoint(157, 225), new TheDrawingPoint(158, 223), new TheDrawingPoint(157, 218), new TheDrawingPoint(155, 211), new TheDrawingPoint(154, 208), new TheDrawingPoint(152, 200), new TheDrawingPoint(150, 189), new TheDrawingPoint(148, 179), new TheDrawingPoint(147, 170), new TheDrawingPoint(147, 158), new TheDrawingPoint(147, 148), new TheDrawingPoint(147, 141), new TheDrawingPoint(147, 136), new TheDrawingPoint(144, 135), new TheDrawingPoint(142, 137), new TheDrawingPoint(140, 139), new TheDrawingPoint(135, 145), new TheDrawingPoint(131, 152), new TheDrawingPoint(124, 163), new TheDrawingPoint(116, 177), new TheDrawingPoint(108, 191), new TheDrawingPoint(100, 206), new TheDrawingPoint(94, 217), new TheDrawingPoint(91, 222), new TheDrawingPoint(89, 225), new TheDrawingPoint(87, 226), new TheDrawingPoint(87, 224)]);
            this.Unistrokes[2] = new Unistroke(this, "rectangle", [new TheDrawingPoint(78, 149), new TheDrawingPoint(78, 153), new TheDrawingPoint(78, 157), new TheDrawingPoint(78, 160), new TheDrawingPoint(79, 162), new TheDrawingPoint(79, 164), new TheDrawingPoint(79, 167), new TheDrawingPoint(79, 169), new TheDrawingPoint(79, 173), new TheDrawingPoint(79, 178), new TheDrawingPoint(79, 183), new TheDrawingPoint(80, 189), new TheDrawingPoint(80, 193), new TheDrawingPoint(80, 198), new TheDrawingPoint(80, 202), new TheDrawingPoint(81, 208), new TheDrawingPoint(81, 210), new TheDrawingPoint(81, 216), new TheDrawingPoint(82, 222), new TheDrawingPoint(82, 224), new TheDrawingPoint(82, 227), new TheDrawingPoint(83, 229), new TheDrawingPoint(83, 231), new TheDrawingPoint(85, 230), new TheDrawingPoint(88, 232), new TheDrawingPoint(90, 233), new TheDrawingPoint(92, 232), new TheDrawingPoint(94, 233), new TheDrawingPoint(99, 232), new TheDrawingPoint(102, 233), new TheDrawingPoint(106, 233), new TheDrawingPoint(109, 234), new TheDrawingPoint(117, 235), new TheDrawingPoint(123, 236), new TheDrawingPoint(126, 236), new TheDrawingPoint(135, 237), new TheDrawingPoint(142, 238), new TheDrawingPoint(145, 238), new TheDrawingPoint(152, 238), new TheDrawingPoint(154, 239), new TheDrawingPoint(165, 238), new TheDrawingPoint(174, 237), new TheDrawingPoint(179, 236), new TheDrawingPoint(186, 235), new TheDrawingPoint(191, 235), new TheDrawingPoint(195, 233), new TheDrawingPoint(197, 233), new TheDrawingPoint(200, 233), new TheDrawingPoint(201, 235), new TheDrawingPoint(201, 233), new TheDrawingPoint(199, 231), new TheDrawingPoint(198, 226), new TheDrawingPoint(198, 220), new TheDrawingPoint(196, 207), new TheDrawingPoint(195, 195), new TheDrawingPoint(195, 181), new TheDrawingPoint(195, 173), new TheDrawingPoint(195, 163), new TheDrawingPoint(194, 155), new TheDrawingPoint(192, 145), new TheDrawingPoint(192, 143), new TheDrawingPoint(192, 138), new TheDrawingPoint(191, 135), new TheDrawingPoint(191, 133), new TheDrawingPoint(191, 130), new TheDrawingPoint(190, 128), new TheDrawingPoint(188, 129), new TheDrawingPoint(186, 129), new TheDrawingPoint(181, 132), new TheDrawingPoint(173, 131), new TheDrawingPoint(162, 131), new TheDrawingPoint(151, 132), new TheDrawingPoint(149, 132), new TheDrawingPoint(138, 132), new TheDrawingPoint(136, 132), new TheDrawingPoint(122, 131), new TheDrawingPoint(120, 131), new TheDrawingPoint(109, 130), new TheDrawingPoint(107, 130), new TheDrawingPoint(90, 132), new TheDrawingPoint(81, 133), new TheDrawingPoint(76, 133)]);
            this.Unistrokes[3] = new Unistroke(this, "circle", [new TheDrawingPoint(127, 141), new TheDrawingPoint(124, 140), new TheDrawingPoint(120, 139), new TheDrawingPoint(118, 139), new TheDrawingPoint(116, 139), new TheDrawingPoint(111, 140), new TheDrawingPoint(109, 141), new TheDrawingPoint(104, 144), new TheDrawingPoint(100, 147), new TheDrawingPoint(96, 152), new TheDrawingPoint(93, 157), new TheDrawingPoint(90, 163), new TheDrawingPoint(87, 169), new TheDrawingPoint(85, 175), new TheDrawingPoint(83, 181), new TheDrawingPoint(82, 190), new TheDrawingPoint(82, 195), new TheDrawingPoint(83, 200), new TheDrawingPoint(84, 205), new TheDrawingPoint(88, 213), new TheDrawingPoint(91, 216), new TheDrawingPoint(96, 219), new TheDrawingPoint(103, 222), new TheDrawingPoint(108, 224), new TheDrawingPoint(111, 224), new TheDrawingPoint(120, 224), new TheDrawingPoint(133, 223), new TheDrawingPoint(142, 222), new TheDrawingPoint(152, 218), new TheDrawingPoint(160, 214), new TheDrawingPoint(167, 210), new TheDrawingPoint(173, 204), new TheDrawingPoint(178, 198), new TheDrawingPoint(179, 196), new TheDrawingPoint(182, 188), new TheDrawingPoint(182, 177), new TheDrawingPoint(178, 167), new TheDrawingPoint(170, 150), new TheDrawingPoint(163, 138), new TheDrawingPoint(152, 130), new TheDrawingPoint(143, 129), new TheDrawingPoint(140, 131), new TheDrawingPoint(129, 136), new TheDrawingPoint(126, 139)]);
            this.Unistrokes[4] = new Unistroke(this, "check", [new TheDrawingPoint(91, 185), new TheDrawingPoint(93, 185), new TheDrawingPoint(95, 185), new TheDrawingPoint(97, 185), new TheDrawingPoint(100, 188), new TheDrawingPoint(102, 189), new TheDrawingPoint(104, 190), new TheDrawingPoint(106, 193), new TheDrawingPoint(108, 195), new TheDrawingPoint(110, 198), new TheDrawingPoint(112, 201), new TheDrawingPoint(114, 204), new TheDrawingPoint(115, 207), new TheDrawingPoint(117, 210), new TheDrawingPoint(118, 212), new TheDrawingPoint(120, 214), new TheDrawingPoint(121, 217), new TheDrawingPoint(122, 219), new TheDrawingPoint(123, 222), new TheDrawingPoint(124, 224), new TheDrawingPoint(126, 226), new TheDrawingPoint(127, 229), new TheDrawingPoint(129, 231), new TheDrawingPoint(130, 233), new TheDrawingPoint(129, 231), new TheDrawingPoint(129, 228), new TheDrawingPoint(129, 226), new TheDrawingPoint(129, 224), new TheDrawingPoint(129, 221), new TheDrawingPoint(129, 218), new TheDrawingPoint(129, 212), new TheDrawingPoint(129, 208), new TheDrawingPoint(130, 198), new TheDrawingPoint(132, 189), new TheDrawingPoint(134, 182), new TheDrawingPoint(137, 173), new TheDrawingPoint(143, 164), new TheDrawingPoint(147, 157), new TheDrawingPoint(151, 151), new TheDrawingPoint(155, 144), new TheDrawingPoint(161, 137), new TheDrawingPoint(165, 131), new TheDrawingPoint(171, 122), new TheDrawingPoint(174, 118), new TheDrawingPoint(176, 114), new TheDrawingPoint(177, 112), new TheDrawingPoint(177, 114), new TheDrawingPoint(175, 116), new TheDrawingPoint(173, 118)]);
            this.Unistrokes[5] = new Unistroke(this, "caret", [new TheDrawingPoint(79, 245), new TheDrawingPoint(79, 242), new TheDrawingPoint(79, 239), new TheDrawingPoint(80, 237), new TheDrawingPoint(80, 234), new TheDrawingPoint(81, 232), new TheDrawingPoint(82, 230), new TheDrawingPoint(84, 224), new TheDrawingPoint(86, 220), new TheDrawingPoint(86, 218), new TheDrawingPoint(87, 216), new TheDrawingPoint(88, 213), new TheDrawingPoint(90, 207), new TheDrawingPoint(91, 202), new TheDrawingPoint(92, 200), new TheDrawingPoint(93, 194), new TheDrawingPoint(94, 192), new TheDrawingPoint(96, 189), new TheDrawingPoint(97, 186), new TheDrawingPoint(100, 179), new TheDrawingPoint(102, 173), new TheDrawingPoint(105, 165), new TheDrawingPoint(107, 160), new TheDrawingPoint(109, 158), new TheDrawingPoint(112, 151), new TheDrawingPoint(115, 144), new TheDrawingPoint(117, 139), new TheDrawingPoint(119, 136), new TheDrawingPoint(119, 134), new TheDrawingPoint(120, 132), new TheDrawingPoint(121, 129), new TheDrawingPoint(122, 127), new TheDrawingPoint(124, 125), new TheDrawingPoint(126, 124), new TheDrawingPoint(129, 125), new TheDrawingPoint(131, 127), new TheDrawingPoint(132, 130), new TheDrawingPoint(136, 139), new TheDrawingPoint(141, 154), new TheDrawingPoint(145, 166), new TheDrawingPoint(151, 182), new TheDrawingPoint(156, 193), new TheDrawingPoint(157, 196), new TheDrawingPoint(161, 209), new TheDrawingPoint(162, 211), new TheDrawingPoint(167, 223), new TheDrawingPoint(169, 229), new TheDrawingPoint(170, 231), new TheDrawingPoint(173, 237), new TheDrawingPoint(176, 242), new TheDrawingPoint(177, 244), new TheDrawingPoint(179, 250), new TheDrawingPoint(181, 255), new TheDrawingPoint(182, 257)]);
            this.Unistrokes[6] = new Unistroke(this, "zig-zag", [new TheDrawingPoint(307, 216), new TheDrawingPoint(333, 186), new TheDrawingPoint(356, 215), new TheDrawingPoint(375, 186), new TheDrawingPoint(399, 216), new TheDrawingPoint(418, 186)]);
            this.Unistrokes[7] = new Unistroke(this, "arrow", [new TheDrawingPoint(68, 222), new TheDrawingPoint(70, 220), new TheDrawingPoint(73, 218), new TheDrawingPoint(75, 217), new TheDrawingPoint(77, 215), new TheDrawingPoint(80, 213), new TheDrawingPoint(82, 212), new TheDrawingPoint(84, 210), new TheDrawingPoint(87, 209), new TheDrawingPoint(89, 208), new TheDrawingPoint(92, 206), new TheDrawingPoint(95, 204), new TheDrawingPoint(101, 201), new TheDrawingPoint(106, 198), new TheDrawingPoint(112, 194), new TheDrawingPoint(118, 191), new TheDrawingPoint(124, 187), new TheDrawingPoint(127, 186), new TheDrawingPoint(132, 183), new TheDrawingPoint(138, 181), new TheDrawingPoint(141, 180), new TheDrawingPoint(146, 178), new TheDrawingPoint(154, 173), new TheDrawingPoint(159, 171), new TheDrawingPoint(161, 170), new TheDrawingPoint(166, 167), new TheDrawingPoint(168, 167), new TheDrawingPoint(171, 166), new TheDrawingPoint(174, 164), new TheDrawingPoint(177, 162), new TheDrawingPoint(180, 160), new TheDrawingPoint(182, 158), new TheDrawingPoint(183, 156), new TheDrawingPoint(181, 154), new TheDrawingPoint(178, 153), new TheDrawingPoint(171, 153), new TheDrawingPoint(164, 153), new TheDrawingPoint(160, 153), new TheDrawingPoint(150, 154), new TheDrawingPoint(147, 155), new TheDrawingPoint(141, 157), new TheDrawingPoint(137, 158), new TheDrawingPoint(135, 158), new TheDrawingPoint(137, 158), new TheDrawingPoint(140, 157), new TheDrawingPoint(143, 156), new TheDrawingPoint(151, 154), new TheDrawingPoint(160, 152), new TheDrawingPoint(170, 149), new TheDrawingPoint(179, 147), new TheDrawingPoint(185, 145), new TheDrawingPoint(192, 144), new TheDrawingPoint(196, 144), new TheDrawingPoint(198, 144), new TheDrawingPoint(200, 144), new TheDrawingPoint(201, 147), new TheDrawingPoint(199, 149), new TheDrawingPoint(194, 157), new TheDrawingPoint(191, 160), new TheDrawingPoint(186, 167), new TheDrawingPoint(180, 176), new TheDrawingPoint(177, 179), new TheDrawingPoint(171, 187), new TheDrawingPoint(169, 189), new TheDrawingPoint(165, 194), new TheDrawingPoint(164, 196)]);
            this.Unistrokes[8] = new Unistroke(this, "left square bracket", [new TheDrawingPoint(140, 124), new TheDrawingPoint(138, 123), new TheDrawingPoint(135, 122), new TheDrawingPoint(133, 123), new TheDrawingPoint(130, 123), new TheDrawingPoint(128, 124), new TheDrawingPoint(125, 125), new TheDrawingPoint(122, 124), new TheDrawingPoint(120, 124), new TheDrawingPoint(118, 124), new TheDrawingPoint(116, 125), new TheDrawingPoint(113, 125), new TheDrawingPoint(111, 125), new TheDrawingPoint(108, 124), new TheDrawingPoint(106, 125), new TheDrawingPoint(104, 125), new TheDrawingPoint(102, 124), new TheDrawingPoint(100, 123), new TheDrawingPoint(98, 123), new TheDrawingPoint(95, 124), new TheDrawingPoint(93, 123), new TheDrawingPoint(90, 124), new TheDrawingPoint(88, 124), new TheDrawingPoint(85, 125), new TheDrawingPoint(83, 126), new TheDrawingPoint(81, 127), new TheDrawingPoint(81, 129), new TheDrawingPoint(82, 131), new TheDrawingPoint(82, 134), new TheDrawingPoint(83, 138), new TheDrawingPoint(84, 141), new TheDrawingPoint(84, 144), new TheDrawingPoint(85, 148), new TheDrawingPoint(85, 151), new TheDrawingPoint(86, 156), new TheDrawingPoint(86, 160), new TheDrawingPoint(86, 164), new TheDrawingPoint(86, 168), new TheDrawingPoint(87, 171), new TheDrawingPoint(87, 175), new TheDrawingPoint(87, 179), new TheDrawingPoint(87, 182), new TheDrawingPoint(87, 186), new TheDrawingPoint(88, 188), new TheDrawingPoint(88, 195), new TheDrawingPoint(88, 198), new TheDrawingPoint(88, 201), new TheDrawingPoint(88, 207), new TheDrawingPoint(89, 211), new TheDrawingPoint(89, 213), new TheDrawingPoint(89, 217), new TheDrawingPoint(89, 222), new TheDrawingPoint(88, 225), new TheDrawingPoint(88, 229), new TheDrawingPoint(88, 231), new TheDrawingPoint(88, 233), new TheDrawingPoint(88, 235), new TheDrawingPoint(89, 237), new TheDrawingPoint(89, 240), new TheDrawingPoint(89, 242), new TheDrawingPoint(91, 241), new TheDrawingPoint(94, 241), new TheDrawingPoint(96, 240), new TheDrawingPoint(98, 239), new TheDrawingPoint(105, 240), new TheDrawingPoint(109, 240), new TheDrawingPoint(113, 239), new TheDrawingPoint(116, 240), new TheDrawingPoint(121, 239), new TheDrawingPoint(130, 240), new TheDrawingPoint(136, 237), new TheDrawingPoint(139, 237), new TheDrawingPoint(144, 238), new TheDrawingPoint(151, 237), new TheDrawingPoint(157, 236), new TheDrawingPoint(159, 237)]);
            this.Unistrokes[9] = new Unistroke(this, "right square bracket", [new TheDrawingPoint(112, 138), new TheDrawingPoint(112, 136), new TheDrawingPoint(115, 136), new TheDrawingPoint(118, 137), new TheDrawingPoint(120, 136), new TheDrawingPoint(123, 136), new TheDrawingPoint(125, 136), new TheDrawingPoint(128, 136), new TheDrawingPoint(131, 136), new TheDrawingPoint(134, 135), new TheDrawingPoint(137, 135), new TheDrawingPoint(140, 134), new TheDrawingPoint(143, 133), new TheDrawingPoint(145, 132), new TheDrawingPoint(147, 132), new TheDrawingPoint(149, 132), new TheDrawingPoint(152, 132), new TheDrawingPoint(153, 134), new TheDrawingPoint(154, 137), new TheDrawingPoint(155, 141), new TheDrawingPoint(156, 144), new TheDrawingPoint(157, 152), new TheDrawingPoint(158, 161), new TheDrawingPoint(160, 170), new TheDrawingPoint(162, 182), new TheDrawingPoint(164, 192), new TheDrawingPoint(166, 200), new TheDrawingPoint(167, 209), new TheDrawingPoint(168, 214), new TheDrawingPoint(168, 216), new TheDrawingPoint(169, 221), new TheDrawingPoint(169, 223), new TheDrawingPoint(169, 228), new TheDrawingPoint(169, 231), new TheDrawingPoint(166, 233), new TheDrawingPoint(164, 234), new TheDrawingPoint(161, 235), new TheDrawingPoint(155, 236), new TheDrawingPoint(147, 235), new TheDrawingPoint(140, 233), new TheDrawingPoint(131, 233), new TheDrawingPoint(124, 233), new TheDrawingPoint(117, 235), new TheDrawingPoint(114, 238), new TheDrawingPoint(112, 238)]);
            this.Unistrokes[10] = new Unistroke(this, "v", [new TheDrawingPoint(89, 164), new TheDrawingPoint(90, 162), new TheDrawingPoint(92, 162), new TheDrawingPoint(94, 164), new TheDrawingPoint(95, 166), new TheDrawingPoint(96, 169), new TheDrawingPoint(97, 171), new TheDrawingPoint(99, 175), new TheDrawingPoint(101, 178), new TheDrawingPoint(103, 182), new TheDrawingPoint(106, 189), new TheDrawingPoint(108, 194), new TheDrawingPoint(111, 199), new TheDrawingPoint(114, 204), new TheDrawingPoint(117, 209), new TheDrawingPoint(119, 214), new TheDrawingPoint(122, 218), new TheDrawingPoint(124, 222), new TheDrawingPoint(126, 225), new TheDrawingPoint(128, 228), new TheDrawingPoint(130, 229), new TheDrawingPoint(133, 233), new TheDrawingPoint(134, 236), new TheDrawingPoint(136, 239), new TheDrawingPoint(138, 240), new TheDrawingPoint(139, 242), new TheDrawingPoint(140, 244), new TheDrawingPoint(142, 242), new TheDrawingPoint(142, 240), new TheDrawingPoint(142, 237), new TheDrawingPoint(143, 235), new TheDrawingPoint(143, 233), new TheDrawingPoint(145, 229), new TheDrawingPoint(146, 226), new TheDrawingPoint(148, 217), new TheDrawingPoint(149, 208), new TheDrawingPoint(149, 205), new TheDrawingPoint(151, 196), new TheDrawingPoint(151, 193), new TheDrawingPoint(153, 182), new TheDrawingPoint(155, 172), new TheDrawingPoint(157, 165), new TheDrawingPoint(159, 160), new TheDrawingPoint(162, 155), new TheDrawingPoint(164, 150), new TheDrawingPoint(165, 148), new TheDrawingPoint(166, 146)]);
            this.Unistrokes[11] = new Unistroke(this, "delete", [new TheDrawingPoint(123, 129), new TheDrawingPoint(123, 131), new TheDrawingPoint(124, 133), new TheDrawingPoint(125, 136), new TheDrawingPoint(127, 140), new TheDrawingPoint(129, 142), new TheDrawingPoint(133, 148), new TheDrawingPoint(137, 154), new TheDrawingPoint(143, 158), new TheDrawingPoint(145, 161), new TheDrawingPoint(148, 164), new TheDrawingPoint(153, 170), new TheDrawingPoint(158, 176), new TheDrawingPoint(160, 178), new TheDrawingPoint(164, 183), new TheDrawingPoint(168, 188), new TheDrawingPoint(171, 191), new TheDrawingPoint(175, 196), new TheDrawingPoint(178, 200), new TheDrawingPoint(180, 202), new TheDrawingPoint(181, 205), new TheDrawingPoint(184, 208), new TheDrawingPoint(186, 210), new TheDrawingPoint(187, 213), new TheDrawingPoint(188, 215), new TheDrawingPoint(186, 212), new TheDrawingPoint(183, 211), new TheDrawingPoint(177, 208), new TheDrawingPoint(169, 206), new TheDrawingPoint(162, 205), new TheDrawingPoint(154, 207), new TheDrawingPoint(145, 209), new TheDrawingPoint(137, 210), new TheDrawingPoint(129, 214), new TheDrawingPoint(122, 217), new TheDrawingPoint(118, 218), new TheDrawingPoint(111, 221), new TheDrawingPoint(109, 222), new TheDrawingPoint(110, 219), new TheDrawingPoint(112, 217), new TheDrawingPoint(118, 209), new TheDrawingPoint(120, 207), new TheDrawingPoint(128, 196), new TheDrawingPoint(135, 187), new TheDrawingPoint(138, 183), new TheDrawingPoint(148, 167), new TheDrawingPoint(157, 153), new TheDrawingPoint(163, 145), new TheDrawingPoint(165, 142), new TheDrawingPoint(172, 133), new TheDrawingPoint(177, 127), new TheDrawingPoint(179, 127), new TheDrawingPoint(180, 125)]);
            this.Unistrokes[12] = new Unistroke(this, "left curly brace", [new TheDrawingPoint(150, 116), new TheDrawingPoint(147, 117), new TheDrawingPoint(145, 116), new TheDrawingPoint(142, 116), new TheDrawingPoint(139, 117), new TheDrawingPoint(136, 117), new TheDrawingPoint(133, 118), new TheDrawingPoint(129, 121), new TheDrawingPoint(126, 122), new TheDrawingPoint(123, 123), new TheDrawingPoint(120, 125), new TheDrawingPoint(118, 127), new TheDrawingPoint(115, 128), new TheDrawingPoint(113, 129), new TheDrawingPoint(112, 131), new TheDrawingPoint(113, 134), new TheDrawingPoint(115, 134), new TheDrawingPoint(117, 135), new TheDrawingPoint(120, 135), new TheDrawingPoint(123, 137), new TheDrawingPoint(126, 138), new TheDrawingPoint(129, 140), new TheDrawingPoint(135, 143), new TheDrawingPoint(137, 144), new TheDrawingPoint(139, 147), new TheDrawingPoint(141, 149), new TheDrawingPoint(140, 152), new TheDrawingPoint(139, 155), new TheDrawingPoint(134, 159), new TheDrawingPoint(131, 161), new TheDrawingPoint(124, 166), new TheDrawingPoint(121, 166), new TheDrawingPoint(117, 166), new TheDrawingPoint(114, 167), new TheDrawingPoint(112, 166), new TheDrawingPoint(114, 164), new TheDrawingPoint(116, 163), new TheDrawingPoint(118, 163), new TheDrawingPoint(120, 162), new TheDrawingPoint(122, 163), new TheDrawingPoint(125, 164), new TheDrawingPoint(127, 165), new TheDrawingPoint(129, 166), new TheDrawingPoint(130, 168), new TheDrawingPoint(129, 171), new TheDrawingPoint(127, 175), new TheDrawingPoint(125, 179), new TheDrawingPoint(123, 184), new TheDrawingPoint(121, 190), new TheDrawingPoint(120, 194), new TheDrawingPoint(119, 199), new TheDrawingPoint(120, 202), new TheDrawingPoint(123, 207), new TheDrawingPoint(127, 211), new TheDrawingPoint(133, 215), new TheDrawingPoint(142, 219), new TheDrawingPoint(148, 220), new TheDrawingPoint(151, 221)]);
            this.Unistrokes[13] = new Unistroke(this, "right curly brace", [new TheDrawingPoint(117, 132), new TheDrawingPoint(115, 132), new TheDrawingPoint(115, 129), new TheDrawingPoint(117, 129), new TheDrawingPoint(119, 128), new TheDrawingPoint(122, 127), new TheDrawingPoint(125, 127), new TheDrawingPoint(127, 127), new TheDrawingPoint(130, 127), new TheDrawingPoint(133, 129), new TheDrawingPoint(136, 129), new TheDrawingPoint(138, 130), new TheDrawingPoint(140, 131), new TheDrawingPoint(143, 134), new TheDrawingPoint(144, 136), new TheDrawingPoint(145, 139), new TheDrawingPoint(145, 142), new TheDrawingPoint(145, 145), new TheDrawingPoint(145, 147), new TheDrawingPoint(145, 149), new TheDrawingPoint(144, 152), new TheDrawingPoint(142, 157), new TheDrawingPoint(141, 160), new TheDrawingPoint(139, 163), new TheDrawingPoint(137, 166), new TheDrawingPoint(135, 167), new TheDrawingPoint(133, 169), new TheDrawingPoint(131, 172), new TheDrawingPoint(128, 173), new TheDrawingPoint(126, 176), new TheDrawingPoint(125, 178), new TheDrawingPoint(125, 180), new TheDrawingPoint(125, 182), new TheDrawingPoint(126, 184), new TheDrawingPoint(128, 187), new TheDrawingPoint(130, 187), new TheDrawingPoint(132, 188), new TheDrawingPoint(135, 189), new TheDrawingPoint(140, 189), new TheDrawingPoint(145, 189), new TheDrawingPoint(150, 187), new TheDrawingPoint(155, 186), new TheDrawingPoint(157, 185), new TheDrawingPoint(159, 184), new TheDrawingPoint(156, 185), new TheDrawingPoint(154, 185), new TheDrawingPoint(149, 185), new TheDrawingPoint(145, 187), new TheDrawingPoint(141, 188), new TheDrawingPoint(136, 191), new TheDrawingPoint(134, 191), new TheDrawingPoint(131, 192), new TheDrawingPoint(129, 193), new TheDrawingPoint(129, 195), new TheDrawingPoint(129, 197), new TheDrawingPoint(131, 200), new TheDrawingPoint(133, 202), new TheDrawingPoint(136, 206), new TheDrawingPoint(139, 211), new TheDrawingPoint(142, 215), new TheDrawingPoint(145, 220), new TheDrawingPoint(147, 225), new TheDrawingPoint(148, 231), new TheDrawingPoint(147, 239), new TheDrawingPoint(144, 244), new TheDrawingPoint(139, 248), new TheDrawingPoint(134, 250), new TheDrawingPoint(126, 253), new TheDrawingPoint(119, 253), new TheDrawingPoint(115, 253)]);
            this.Unistrokes[14] = new Unistroke(this, "star", [new TheDrawingPoint(75, 250), new TheDrawingPoint(75, 247), new TheDrawingPoint(77, 244), new TheDrawingPoint(78, 242), new TheDrawingPoint(79, 239), new TheDrawingPoint(80, 237), new TheDrawingPoint(82, 234), new TheDrawingPoint(82, 232), new TheDrawingPoint(84, 229), new TheDrawingPoint(85, 225), new TheDrawingPoint(87, 222), new TheDrawingPoint(88, 219), new TheDrawingPoint(89, 216), new TheDrawingPoint(91, 212), new TheDrawingPoint(92, 208), new TheDrawingPoint(94, 204), new TheDrawingPoint(95, 201), new TheDrawingPoint(96, 196), new TheDrawingPoint(97, 194), new TheDrawingPoint(98, 191), new TheDrawingPoint(100, 185), new TheDrawingPoint(102, 178), new TheDrawingPoint(104, 173), new TheDrawingPoint(104, 171), new TheDrawingPoint(105, 164), new TheDrawingPoint(106, 158), new TheDrawingPoint(107, 156), new TheDrawingPoint(107, 152), new TheDrawingPoint(108, 145), new TheDrawingPoint(109, 141), new TheDrawingPoint(110, 139), new TheDrawingPoint(112, 133), new TheDrawingPoint(113, 131), new TheDrawingPoint(116, 127), new TheDrawingPoint(117, 125), new TheDrawingPoint(119, 122), new TheDrawingPoint(121, 121), new TheDrawingPoint(123, 120), new TheDrawingPoint(125, 122), new TheDrawingPoint(125, 125), new TheDrawingPoint(127, 130), new TheDrawingPoint(128, 133), new TheDrawingPoint(131, 143), new TheDrawingPoint(136, 153), new TheDrawingPoint(140, 163), new TheDrawingPoint(144, 172), new TheDrawingPoint(145, 175), new TheDrawingPoint(151, 189), new TheDrawingPoint(156, 201), new TheDrawingPoint(161, 213), new TheDrawingPoint(166, 225), new TheDrawingPoint(169, 233), new TheDrawingPoint(171, 236), new TheDrawingPoint(174, 243), new TheDrawingPoint(177, 247), new TheDrawingPoint(178, 249), new TheDrawingPoint(179, 251), new TheDrawingPoint(180, 253), new TheDrawingPoint(180, 255), new TheDrawingPoint(179, 257), new TheDrawingPoint(177, 257), new TheDrawingPoint(174, 255), new TheDrawingPoint(169, 250), new TheDrawingPoint(164, 247), new TheDrawingPoint(160, 245), new TheDrawingPoint(149, 238), new TheDrawingPoint(138, 230), new TheDrawingPoint(127, 221), new TheDrawingPoint(124, 220), new TheDrawingPoint(112, 212), new TheDrawingPoint(110, 210), new TheDrawingPoint(96, 201), new TheDrawingPoint(84, 195), new TheDrawingPoint(74, 190), new TheDrawingPoint(64, 182), new TheDrawingPoint(55, 175), new TheDrawingPoint(51, 172), new TheDrawingPoint(49, 170), new TheDrawingPoint(51, 169), new TheDrawingPoint(56, 169), new TheDrawingPoint(66, 169), new TheDrawingPoint(78, 168), new TheDrawingPoint(92, 166), new TheDrawingPoint(107, 164), new TheDrawingPoint(123, 161), new TheDrawingPoint(140, 162), new TheDrawingPoint(156, 162), new TheDrawingPoint(171, 160), new TheDrawingPoint(173, 160), new TheDrawingPoint(186, 160), new TheDrawingPoint(195, 160), new TheDrawingPoint(198, 161), new TheDrawingPoint(203, 163), new TheDrawingPoint(208, 163), new TheDrawingPoint(206, 164), new TheDrawingPoint(200, 167), new TheDrawingPoint(187, 172), new TheDrawingPoint(174, 179), new TheDrawingPoint(172, 181), new TheDrawingPoint(153, 192), new TheDrawingPoint(137, 201), new TheDrawingPoint(123, 211), new TheDrawingPoint(112, 220), new TheDrawingPoint(99, 229), new TheDrawingPoint(90, 237), new TheDrawingPoint(80, 244), new TheDrawingPoint(73, 250), new TheDrawingPoint(69, 254), new TheDrawingPoint(69, 252)]);
            this.Unistrokes[15] = new Unistroke(this, "pigtail", [new TheDrawingPoint(81, 219), new TheDrawingPoint(84, 218), new TheDrawingPoint(86, 220), new TheDrawingPoint(88, 220), new TheDrawingPoint(90, 220), new TheDrawingPoint(92, 219), new TheDrawingPoint(95, 220), new TheDrawingPoint(97, 219), new TheDrawingPoint(99, 220), new TheDrawingPoint(102, 218), new TheDrawingPoint(105, 217), new TheDrawingPoint(107, 216), new TheDrawingPoint(110, 216), new TheDrawingPoint(113, 214), new TheDrawingPoint(116, 212), new TheDrawingPoint(118, 210), new TheDrawingPoint(121, 208), new TheDrawingPoint(124, 205), new TheDrawingPoint(126, 202), new TheDrawingPoint(129, 199), new TheDrawingPoint(132, 196), new TheDrawingPoint(136, 191), new TheDrawingPoint(139, 187), new TheDrawingPoint(142, 182), new TheDrawingPoint(144, 179), new TheDrawingPoint(146, 174), new TheDrawingPoint(148, 170), new TheDrawingPoint(149, 168), new TheDrawingPoint(151, 162), new TheDrawingPoint(152, 160), new TheDrawingPoint(152, 157), new TheDrawingPoint(152, 155), new TheDrawingPoint(152, 151), new TheDrawingPoint(152, 149), new TheDrawingPoint(152, 146), new TheDrawingPoint(149, 142), new TheDrawingPoint(148, 139), new TheDrawingPoint(145, 137), new TheDrawingPoint(141, 135), new TheDrawingPoint(139, 135), new TheDrawingPoint(134, 136), new TheDrawingPoint(130, 140), new TheDrawingPoint(128, 142), new TheDrawingPoint(126, 145), new TheDrawingPoint(122, 150), new TheDrawingPoint(119, 158), new TheDrawingPoint(117, 163), new TheDrawingPoint(115, 170), new TheDrawingPoint(114, 175), new TheDrawingPoint(117, 184), new TheDrawingPoint(120, 190), new TheDrawingPoint(125, 199), new TheDrawingPoint(129, 203), new TheDrawingPoint(133, 208), new TheDrawingPoint(138, 213), new TheDrawingPoint(145, 215), new TheDrawingPoint(155, 218), new TheDrawingPoint(164, 219), new TheDrawingPoint(166, 219), new TheDrawingPoint(177, 219), new TheDrawingPoint(182, 218), new TheDrawingPoint(192, 216), new TheDrawingPoint(196, 213), new TheDrawingPoint(199, 212), new TheDrawingPoint(201, 211)]);
        }

        //
        // The $1 Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
        //
        Recognize(inPoints: TheDrawingPoint[], useProtractor) {
            const t0 = Date.now();
            let points = this.Resample(inPoints, this.NumPoints);
            const radians = this.IndicativeAngle(points);
            points = this.RotateBy(points, -radians);
            points = this.ScaleTo(points, this.SquareSize);
            points = this.TranslateTo(points, this.Origin);
            const vector = this.Vectorize(points); // for Protractor

            let b = +Infinity;
            let u = -1;
            for (let i = 0; i < this.Unistrokes.length; i++) // for each unistroke
            {
                let d;
                if (useProtractor) // for Protractor
                    d = this.OptimalCosineDistance(this.Unistrokes[i].Vector, vector);
                else // Golden Section Search (original $1)
                    d = this.DistanceAtBestAngle(points, this.Unistrokes[i], -this.AngleRange, +this.AngleRange, this.AnglePrecision);
                if (d < b) {
                    b = d; // best (least) distance
                    u = i; // unistroke index
                }
            }
            const t1 = Date.now();
            return (u === -1) ? new TheRecognizerResult("No match", 0.0, t1 - t0) : new TheRecognizerResult(this.Unistrokes[u].Name, useProtractor ? 1.0 / b : 1.0 - b / this.HalfDiagonal, t1 - t0);
        }
        public AddGesture(name, points) {
            this.Unistrokes[this.Unistrokes.length] = new Unistroke(this, name, points); // append new unistroke
            let num = 0;
            for (let i = 0; i < this.Unistrokes.length; i++) {
                if (this.Unistrokes[i].Name === name)
                    num++;
            }
            return num;
        }
        DeleteUserGestures() {
            this.Unistrokes.length = this.NumUnistrokes; // clear any beyond the original set
            return this.NumUnistrokes;
        }

        //
        // Private helper functions from here on down
        //
        Resample(points: TheDrawingPoint[], n) {
            const I = this.PathLength(points) / (n - 1); // interval length
            let D = 0.0;
            const newpoints: TheDrawingPoint[] = new Array(points[0]);
            for (let i = 1; i < points.length; i++) {
                const d = this.Distance(points[i - 1], points[i]);
                if ((D + d) >= I) {
                    const qx = points[i - 1].x + ((I - D) / d) * (points[i].x - points[i - 1].x);
                    const qy = points[i - 1].y + ((I - D) / d) * (points[i].y - points[i - 1].y);
                    const q = new TheDrawingPoint(qx, qy);
                    newpoints[newpoints.length] = q; // append new point 'q'
                    points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
                    D = 0.0;
                }
                else D += d;
            }
            if (newpoints.length === n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
                newpoints[newpoints.length] = new TheDrawingPoint(points[points.length - 1].x, points[points.length - 1].y);
            return newpoints;
        }
        IndicativeAngle(points: TheDrawingPoint[]) {
            const c = this.Centroid(points);
            return Math.atan2(c.y - points[0].y, c.x - points[0].x);
        }
        RotateBy(points: TheDrawingPoint[], radians: number) // rotates points around centroid
        {
            const c = this.Centroid(points);
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);
            const newpoints = [];
            for (let i = 0; i < points.length; i++) {
                const qx = (points[i].x - c.x) * cos - (points[i].y - c.y) * sin + c.x
                const qy = (points[i].x - c.x) * sin + (points[i].y - c.y) * cos + c.y;
                newpoints[newpoints.length] = new TheDrawingPoint(qx, qy);
            }
            return newpoints;
        }
        ScaleTo(points: TheDrawingPoint[], size: number) // non-uniform scale; assumes 2D gestures (i.e., no lines)
        {
            const B = this.BoundingBox(points);
            const newpoints = [];
            for (let i = 0; i < points.length; i++) {
                const qx = points[i].x * (size / B.Width);
                const qy = points[i].x * (size / B.Height);
                newpoints[newpoints.length] = new TheDrawingPoint(qx, qy);
            }
            return newpoints;
        }
        TranslateTo(points: TheDrawingPoint[], pt: TheDrawingPoint) // translates points' centroid
        {
            const c = this.Centroid(points);
            const newpoints = [];
            for (let i = 0; i < points.length; i++) {
                const qx = points[i].x + pt.x - c.x;
                const qy = points[i].y + pt.y - c.y;
                newpoints[newpoints.length] = new TheDrawingPoint(qx, qy);
            }
            return newpoints;
        }
        Vectorize(points: TheDrawingPoint[]) // for Protractor
        {
            let sum = 0.0;
            const vector = [];
            for (let i = 0; i < points.length; i++) {
                vector[vector.length] = points[i].x;
                vector[vector.length] = points[i].y;
                sum += points[i].x * points[i].x + points[i].y * points[i].y;
            }
            const magnitude = Math.sqrt(sum);
            for (let i = 0; i < vector.length; i++)
                vector[i] /= magnitude;
            return vector;
        }
        OptimalCosineDistance(v1, v2) // for Protractor
        {
            let a = 0.0;
            let b = 0.0;
            for (let i = 0; i < v1.length; i += 2) {
                a += v1[i] * v2[i] + v1[i + 1] * v2[i + 1];
                b += v1[i] * v2[i + 1] - v1[i + 1] * v2[i];
            }
            const angle = Math.atan(b / a);
            return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
        }
        DistanceAtBestAngle(points: TheDrawingPoint[], T, a, b, threshold) {
            let x1 = this.Phi * a + (1.0 - this.Phi) * b;
            let f1 = this.DistanceAtAngle(points, T, x1);
            let x2 = (1.0 - this.Phi) * a + this.Phi * b;
            let f2 = this.DistanceAtAngle(points, T, x2);
            while (Math.abs(b - a) > threshold) {
                if (f1 < f2) {
                    b = x2;
                    x2 = x1;
                    f2 = f1;
                    x1 = this.Phi * a + (1.0 - this.Phi) * b;
                    f1 = this.DistanceAtAngle(points, T, x1);
                } else {
                    a = x1;
                    x1 = x2;
                    f1 = f2;
                    x2 = (1.0 - this.Phi) * a + this.Phi * b;
                    f2 = this.DistanceAtAngle(points, T, x2);
                }
            }
            return Math.min(f1, f2);
        }
        DistanceAtAngle(points: TheDrawingPoint[], T, radians) {
            const newpoints = this.RotateBy(points, radians);
            return this.PathDistance(newpoints, T.Points);
        }
        Centroid(points: TheDrawingPoint[]) {
            let x = 0.0, y = 0.0;
            for (let i = 0; i < points.length; i++) {
                x += points[i].x;
                y += points[i].y;
            }
            x /= points.length;
            y /= points.length;
            return new TheDrawingPoint(x, y);
        }
        BoundingBox(points: TheDrawingPoint[]) {
            let minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
            for (let i = 0; i < points.length; i++) {
                minX = Math.min(minX, points[i].x);
                minY = Math.min(minY, points[i].y);
                maxX = Math.max(maxX, points[i].x);
                maxY = Math.max(maxY, points[i].y);
            }
            return new TheRectangle(minX, minY, maxX - minX, maxY - minY);
        }
        PathDistance(pts1, pts2) {
            let d = 0.0;
            for (let i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
                d += this.Distance(pts1[i], pts2[i]);
            return d / pts1.length;
        }
        PathLength(points: TheDrawingPoint[]) {
            let d = 0.0;
            for (let i = 1; i < points.length; i++)
                d += this.Distance(points[i - 1], points[i]);
            return d;
        }

        Distance(p1: TheDrawingPoint, p2: TheDrawingPoint) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        Deg2Rad(d) { return (d * Math.PI / 180.0); }

        public RecogizeShape(pDrawObject: TheDrawingObject, ScoreMin: number, useProtractor = true): TheRecognizerResult {
            const tPts: TheDrawingPoint[] = new Array<TheDrawingPoint>();
            for (const tt in pDrawObject.ComplexData) {
                tPts.push(new TheDrawingPoint(pDrawObject.ComplexData[tt].PO.x, pDrawObject.ComplexData[tt].PO.y));
            }
            if (tPts.length < 3)
                return null;
            const res = this.Recognize(tPts, useProtractor);
            if (res) {
                if (res.Score > ScoreMin) {
                    //cdeNMI.ShowToastMessage("Name: " + res.Name + " Score:" + res.Score + " Time:" + res.Time);
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "ShapeRecognizer", "Name: " + res.Name + " Accu:" + res.Score.toFixed(2) + " Time:" + res.Time);
                    return res;
                } else {
                    //cdeNMI.ShowToastMessage("Guess is : " + res.Name + " but Score too low:" + res.Score);
                    return null;
                }
            }
            return null;
        }
    }
}