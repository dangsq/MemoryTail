include <BOSL2/std.scad>;
include <BOSL2/beziers.scad>;

/**
 * Parametric Snake Link
 *
 * Author: Jason Koolman
 * Version: 1.0
 *
 * Description:
 * This OpenSCAD script generates a parametric snake-like chain link with customizable
 * size, shape, wave distortion, and base geometry. The script supports flexible
 * configuration of the squircle-based geometry and wave patterns for creating
 * organic or mechanical chain shapes.
 *
 * License:
 * This script is shared under the Creative Commons Attribution (CCA) license. Use, modify
 * and share it freely, provided that proper credit is given to the author.
 */
 
/* [🔗 Link] */

// Radius of the squircle path.
Link_Size = 16; // [8:1:30]

// Height of the 3D extrusion.
Link_Height = 10; // [5:1:30]

// Squareness of the squircle.
Link_Squareness = 0.25; // [0.1:0.05:1]

// Amplitude of the wave distortion.
Link_Wave_Height = 3.2; // [0:0.1:10]

// Radius of the base.
Link_Base_Size = 11; // [5:1:20]

// Height of the base.
Link_Base_Height = 4.2; // [2:0.1:10]

// Inset/taper towards the base along the height.
Link_Base_Inset = 1; // [0:0.1:4]

// Rounding radius for the base rectangle corners.
Link_Base_Rounding = 2; // [0:0.1:4]

// Additional height for the inner base part.
Link_Base_Ground = 0.4; // [0:0.1:5]

// Global scaling factor for the link.
Link_Scale = 1; // [0.5:0.1:2]

/* [🔩 Joint] */

// Radius of the ball socket and pin.
Joint_Radius = 2.8; // [1.5:0.1:5]

// Cut depth of the ball socket (fraction of the radius to trim).
Joint_Cut = 0.5; // [0:0.05:1]

// Additional clearance for assembly gap between ball and socket).
Joint_Clearance = 0.12; // [0.05:0.01:0.3]

// Whether to cut slits in the socket.
Joint_Slits = true;

// Size of the slits as [width, height].
Joint_Slit_Size = [1.2, 3.4];

/* [📸 Render] */

// Render resolution (affects detail level)
Resolution = "High"; // ["Ultra", "High", "Medium", "Low"]

// Determine face angle and size based on resolution
Face = (Resolution == "Ultra") ? [1, 0.1]
    : (Resolution == "High") ? [2, 0.2]
    : (Resolution == "Medium") ? [2, 0.4]
    : [4, 0.8];

$fa = Face[0];
$fs = Face[1];
$slop = Joint_Clearance;

// Create link

vnf = link_vnf(
    size = Link_Size,
    height = Link_Height,
    squareness = Link_Squareness,
    wave_height = Link_Wave_Height,
    base_size = Link_Base_Size,
    base_height = Link_Base_Height,
    base_inset = Link_Base_Inset,
    base_rounding = Link_Base_Rounding,
    base_ground = Link_Base_Ground,
);
vnf_bounds = pointlist_bounds(vnf_vertices(vnf));
vnf_size = vnf_bounds[1] - vnf_bounds[0];

scale(Link_Scale)
link();

/**
 * Creates a Snake Link.
 */
module link(anchor, spin, orient) {
    base_z = Link_Height + Link_Base_Ground;
    
    anchors = [
        named_anchor("base", [0, 0, base_z], UP)
    ];

    attachable(anchor = anchor, spin = spin, orient = orient, vnf = vnf, anchors = anchors) {
        union() {
            difference() {
                vnf_polyhedron(vnf);
                
                // Ball socket
                ball_socket(
                    r = Joint_Radius,
                    cut = Joint_Cut,
                    slits = Joint_Slits,
                    slit_w = Joint_Slit_Size.x,
                    slit_h = Joint_Slit_Size.y
                );
            }
            
            // Ball pin
            up(base_z)
                ball_pin(r = Joint_Radius);
        }
        children();
    }
}

/**
 * Generates the VNF for a single link.
 *
 * @param size          Size [x,y] of the squircle.
 * @param height        Height of the squircle.
 * @param squareness    Squareness of the squircle.
 * @param wave_height   Height of the wave distortion.
 * @param base_size     Size [x,y] of the base.
 * @param base_height   Height of the base.
 * @param base_inset    Inset/taper towards the base along the height.
 * @param base_rounding Rounding radius for the base rectangle.
 * @param base_ground   Additional height for the inner part of the base.
 * @param base_spin     Z-axis rotation of the base shape.
 * @param steps         Number of steps (spline steps) for the skin path.
 */
function link_vnf(
    size = 16,
    height = 10,
    squareness = 0.25,
    wave_height = 3.2,
    base_size = 11,
    base_height = 4.2,
    base_inset = 1,
    base_rounding = 2,
    base_ground = 0.4,
    base_spin = 45,
    steps = segs(quant(1, $fs))
) =
    let (   
        bezpath = wave_bezpath(size / 2, wave_height / 2, wave_height / 2, squareness),
        wavy_path = bezpath_curve(bezpath, splinesteps = steps),
        orect_path = path3d(rect(base_size, rounding = base_rounding, spin = base_spin)),
        irect_path = path3d(rect(base_size - base_inset * 2, rounding = base_rounding, spin = base_spin)),
        shapes = [
            scale(0.85, irect_path),                                // Bottom inset base
            up(base_height, scale(0.85, orect_path)),               // Bottom outset base
            up(base_height + wave_height / 1.2, wavy_path),         // Start wave path      
            up(base_height + wave_height / 2 + height, wavy_path),  // End wave path
            up(base_height + height + wave_height / 4, scale(0.85, wavy_path)), // Top wave outset
            up(height + base_ground, irect_path),                   // Top base inset
        ]
    )
    skin(
        shapes,
        slices = 0,
        refine = 1,
        closed = false,
        spin = 45,
        method = ["direct", "reindex", "fast_distance", "direct", "reindex"],
    );

/**
 * Generates control points for a wavy Bezier path in 3D.
 *
 * The path forms a squircle-like shape with upward and downward wave distortion.
 *
 * @param size        Radius of the squircle path.
 * @param wave_h_c    Height offset at the corners of the squircle.
 * @param wave_h_m    Height offset at the midpoints of the squircle.
 * @param squareness  Controls how rounded or square the shape is.
 * 
 * @return            A list of 3D points representing Bezier path.
 */
function wave_bezpath(size, wave_h_c, wave_h_m, squareness = 0.25) = 
    let (
        cmin = 1 / 8 * size,
        cmax = 3 / 4 * size,
        cnorm = cmin + squareness * (cmax - cmin),
        curve = size / cnorm
    )
    [
        [0, size, 0], [curve, size, wave_h_c], [size, curve, wave_h_m],
        [size, 0, 0], [size, -curve, -wave_h_m], [curve, -size, -wave_h_c],
        [0, -size, 0], [-curve, -size, wave_h_c], [-size, -curve, wave_h_m],
        [-size, 0, 0], [-size, curve, -wave_h_m], [-curve, size, -wave_h_c],
        [0, size, 0]
    ];

/**
 * Creates a ball pin that fits into a ball socket.
 * 
 * @param r       Radius of the ball at the top of the pin.
 * @param base_r  Optional base radius of the cylindrical section.
 * 
 * @example
 * // Creates a ball pin with a 2.8 radius and a matching base:
 * ball_pin(r = 2.8);
 */
module ball_pin(r = 2.8, base_r) {
    cyl(r1 = (base_r ? base_r : r), l = r, r2 = 0, anchor = BOTTOM);
    sphere(r = r, anchor = BOTTOM);
}

/**
 * Creates a ball socket mask to cut out a socket for the ball pin.
 *
 * The socket is shaped to accommodate a ball pin, with optional slits for flexibility.
 * The socket has a specified opening angle and can be customized with slit dimensions.
 * 
 * @param r         Radius of the ball that fits within the socket.
 * @param angle     Angle of the socket's opening (in degrees). Larger values make the opening wider.
 * @param cut       Cut depth (as a fraction of the radius) that determines how deep the socket cuts.
 * @param slits     Boolean to determine whether to add slits to the socket for flexibility.
 * @param slit_w    Width of the slits.
 * @param slit_h    Height of the slits.
 * @param anchor    Positioning anchor for the socket.
 * @param orient    Orientation vector for aligning the socket.
 * @param spin      Spin angle for rotating the socket.
 * 
 * @example
 * // Creates a ball socket with slits:
 * ball_socket(r = 2.8, angle = 45, cut = 0.5, slits = true, slit_w = 1.2, slit_h = 3.4);
 */
module ball_socket(
    r = 2.8,
    angle = 45,
    cut = 0.5,
    slits = true,
    slit_w = 1.2,
    slit_h = 3.4,
    anchor,
    orient,
    spin
) {
    rr = r + get_slop();
    cr = rr * cut;
    vnf = up(0, onion(r = rr, ang = angle));
    cut_vnf = vnf_halfspace([0, 0, 1, -rr + cr], vnf);

    up(rr - cr - 0.01) {
        vnf_polyhedron(cut_vnf);
        up(cr) cyl(r1 = rr, l = rr, r2 = 0, anchor = TOP);
    }
    
    if (slits) {
        zrot_copies([0, 90])
            cuboid([slit_w, rr * 4, slit_h], chamfer = slit_w / 2);
    }
}
