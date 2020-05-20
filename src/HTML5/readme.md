# C-DEngine HTML5 Components

### CDMyNMIHtml5RT - the NMI-RT (Runtime) plugin

If you install this plugin in your solution and referenc it with a C-DEngine based host, you can access the NMI on any browser.
Details how to do this can be found in our ["Getting Started"](https://github.com/TRUMPF-IoT/C-DEDocs/blob/master/docs/Coding/HelloWorld.md)

### cdeTS - the source of the NMI JavaScript Engine written in TypeScript

The NMI-RT contains the binary output of this project under ClientBin/cde/cde.js.
To make changes to the JS runtime you need to edit and compile this project

The NMI-RT is written 100% in TypeScript and has only a couple references. Since C-DEngine Hosts can run on-premises without cloud access, these references are built into the NMI-RT:

+ Choices.js (drop down combo box)
+ flatpickr.js and flatpickr.monthselect.js (date-time and month pickers)
+ jdenticon.js (ad-hoc icon creation)
+ moment.js (date-time conversion)

The following two libraries are exclusively used in the C-DEngine Diagnostics page "cdeStatus.aspx":

+ Sorttable.js (sorts tables by column header)
+ excellentexport.js (allows to export the content of a table in CSV or JSON)


## Extension Plugins

The NMI can be extended either on the backend (C#) or Frontend (TypeScript)

This folder contains plugins that extend the NMI with new controls
