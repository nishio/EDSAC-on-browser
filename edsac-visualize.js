// not organized yet

edsac.Visualize = {}

edsac.Visualize.test = function(){
    var num_bits = 71;
    var width_of_a_bit = 10;
    var margin_between_bits = 2;
    var margin = 3;
    var canvas_width = width_of_a_bit * num_bits + margin_between_bits * (num_bits - 1) + margin * 2;
    var canvas_height = width_of_a_bit + margin * 2
    var paper = Raphael($('#accumulator')[0], canvas_width, canvas_height);
    var background = paper.rect(0, 0, canvas_width, canvas_height);
    background.attr("fill", "#000");

    for(var i = 0; i < 71; i++){
        var radius = width_of_a_bit / 2;
        var cy = margin + radius;
        var cx = margin + i * (width_of_a_bit + margin_between_bits) + radius;
        var circle = paper.circle(cx, cy, radius);
        circle.attr("fill", "#0f0");
        circle.attr("stroke", "#fff");
    }
}

// need to call after DOM become ready
$(edsac.Visualize.test);
