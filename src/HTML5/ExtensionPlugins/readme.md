## NMI Extension plugins

The plugins in this folder extend the NMI with new controls.

The syntax for new extensions is "P(Number) - (PluginName)"
+ "P" prefix specifies "Plugin"
+ (Number) is a project number in order to give each plugin its own folder in ClientBin
+ (PluginName) referes to the plugins logic. It must start with CDMy as all C-DEngine plugins

Example: "P172 - CDMyC3" is a wrapper for the C3 library

The C-DEngine and the NMI can run fully atonomous without internet access on local on-premises nodes.
For this reason all wrapped controls and libraries have to be contained within the plugin.
Each plugin has a folder under "/ClientBin/plugins/P(number)" for its embedded resources.

We add new extension plugins from time to time here

### List of Plugins

#### P172 - CDMyC3 - a wrapper for the C3 library

This plugin adds Charting capability to the NMI by wrapping the D3 and C3 libraries as well as smoothie.js and CytoScape.

Embedded Resources included:
+ D3.js - [D3 Library](https://d3js.org/) - [on Github](https://github.com/d3/d3) (license: BSD-3-Clause)
+ C3.js - [C3 Library](https://c3js.org/) - [on Github](https://github.com/c3js/c3) (license: MIT)
+ smoothie.js - [Smoothie Chart](http://smoothiecharts.org/) - [on Github](https://github.com/joewalnes/smoothie/) (license: MIT)
+ cycoscape.js - [CytoScape Charts](https://js.cytoscape.org/) - [on Github](https://github.com/cytoscape/cytoscape.js) (license: CytoScape Consortium)


