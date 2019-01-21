# Qwik Trellis
Qwik Trellis is a Qlik Sense extension which allows you to create a trellis chart object based on an existing master vizulisation.
![Qwik Trellis](https://raw.githubusercontent.com/rileymd88/data/master/qwik-trellis/qwiktrellis2.PNG)
![Qwik Trellis GIF](https://raw.githubusercontent.com/rileymd88/data/master/qwik-trellis/qwiktrellis2.gif)

## Important Information
>This extension code requires packing using the qExt tools. You can NOT download the repo and directly install. To get the correct approved version download from the releases page (file: qwik-trellis.zip) and install directly into Qlik Sense.

* [GitHub releases page](https://github.com/rileymd88/qwik-trellis/releases)

Only developers need to use qExt
* [qExt](https://github.com/axisgroup/qExt)

## Features in v0.2
* Ability to create Trellis chart based on master item and 1 dimension
* Ability to hide labels on one side only
* Ability to force all dimensions to be shown
* Advanced mode which allows full flexibility of how formulas are handled in the end trellis objects

## Using Advanced Mode
Qwik Trellis will try to automatically inject the correct set analysis into your formula, however if you need more flexibility then there is an advanced mode available. When advanced mode is turned on, Qwik Trellis will automatically replace all placeholders found within all formulas in the master item vizulisation with the following values:
| Placeholders  | Values                                     |
| ------------- |:------------------------------------------:|
| $(vDim)       | Dimension Name                             |
| $(vDimValue)  | Dimension Value                            |
| $(vDimSet)    | [Dimension Name]={'Dimension Value'},      |
| $(vDimSetFull)| {<[Dimension Name]={'Dimension Value'}>}   |







