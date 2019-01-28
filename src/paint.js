var qlik = window.require('qlik');

export default function ($element, layout) {
    var x = document.getElementById("qtOverlay");
    if (qlik.navigation.getMode() == 'edit') {
        x.style.display = "block";
    }
    else {
        x.style.display = "none";
    }
}