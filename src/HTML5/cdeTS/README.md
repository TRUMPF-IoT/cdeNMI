# cdeTS

This project contains the source of the NMI JavaScript Engine (cde.js) with all base NMI controls and styles.

## CSS Structure
**MainBaseColor** contains all the basic color definitions of the engine - with placeholders for light and dark entries

**LBaseColor** Light (theme) entries. 

**BaseColor** dark (theme) entries. Look at the SCSS to see how they are compiled

**MYSTYLES** blank file that can be overwritten by a develop/end-user by dropping a MYSTYLES.CSS in the ClientBin/CSS folder of your relay to overwrite any of our base CSS


**MYSTYLESH,L,P,W,X are for the different platforms**

| Platform      | Identifier |
| ------------- |:----------:| 
| Phone         | P          |
| PC            | L          |
| Xbox          | X          |
| HoloLens      | H          |
| Tesla         | T          |

Each contains base dashboard styles for identified platform.

ALL but CDESTYLES.css can be overwritten by dropping the same name CSS file in the lientBin/CSS folder. Our recommended way to skin a Relay is to include the BaseColor.CSS and LBaseColor.CSS in a "Skin" plugin (in our cases always in the "...Config.dll's.

