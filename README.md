# Qwik Trellis
Qwik Trellis is a Qlik Sense extension which allows you to create a trellis chart object based on an existing master vizulisation.

# Using Advanced Mode
Qwik Trellis will try to automatically inject the correct set analysis into your formula, however if you need more flexibility then there is an advanced mode available. When advanced mode is turned on, Qwik Trellis will automatically replace all placeholders found within all formulas in the master item vizulisation with the following values:

| Placeholders   | Values                                   |
|----------------|------------------------------------------|
| $(vDim)        | Dimension Name                           |
| $(vDimValue)   | Dimension Value                          |
| $(vDimSet)     | [Dimension Name]={'Dimension Value'},    |
| $(vDimSetFull) | {<[Dimension Name]={'Dimension Value'}>} |

# Resources Used in this Extension
[Qwik Trellis by Riley MacDonald](https://github.com/rileymd88/qwik-trellis)


# Original authors
[github.com/rileymd88](https://github.com/rileymd88)


# License
Released under the [MIT License](LICENSE).
