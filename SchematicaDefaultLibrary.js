let libraryCode = `(// Schematica Default Library (SDL)
  This is the default library of Schematica
   - that is, the code that runs automatically
  along with every user script that is run.)

(// macro (def (#name #args..) #body..)
  (eval (list 'let '#name (concat (list '! '#args..) '#body..))))

(macro (rep #var #default)
  (set #var (u-repl #var #default)))

(def (group-expr-maker val)
  (if (list? val)
    (list (list '= '--arg-- (list 'quote (car val)))
          (list 'if (list '= (car val) #u)
                (cadr val)
                (car val)))
    (list (list '= '--arg-- (list 'quote val)) val)))
(// def (strip-cdrs lst)
  (map (! li (if (list? li)
            (car li) li))
       lst))
(macro (group #name #vals..)
  (eval (list 'def (concat (list '#name) (strip-cdrs '#vals..))
          (list '! (list '--arg--)
                (concat (list 'cond)
                        (map group-expr-maker '#vals..))))))

(// let tau (* 2 pi))
(// let pi/2 (/ pi 2))
(// def (deg rad) (* rad 180 (/ 1 pi)))
(// def (rad deg) (* deg pi (/ 1 180)))
(// def (ng x) (* -1 x))
(// def (++ x) (+ x 1))
(// def (-- x) (- x 1))
(macro (++! #x) (set #x (+ #x 1)))
(macro (--! #x) (set #x (- #x 1)))
(// def (!= x y) (not (= x y)))
(// def (caar l) (car (car l)))
(// def (cadr l) (car (cdr l)))
(// def (cdar l) (cdr (car l)))
(// def (cddr l) (cdr (cdr l)))
(def (u-repl value default) (if (= value #u) default value))
(// def (rand-x) (* (random) canvas-width))
(// def (rand-y) (* (random) canvas-height))
(// def (rand-point) (coord (rand-x) (rand-y)))
(// def (coord x y) (list 'coord x y))
(// def (x-of p) (nth p 1))
(// def (y-of p) (nth p 2))
(// def (coord? p) (= (first p) 'coord))
(// def (distance a b)
  (let Dx (- (x-of a) (x-of b))) (let Dy (- (y-of a) (y-of b)))
  (sqrt (+ (pow Dx 2) (pow Dy 2))))
(def (in-bounds? p)
  (let px (x-of p))
  (let py (y-of p))
  (if (or (> px canvas-width) (> py canvas-height)
          (< px 0) (< py 0))
    #f
    #t))
(// def (translate-coord p dx dy)
  (coord (+ (x-of p) dx)
         (+ (y-of p) dy)))
(def (over p dist)
  (rep dist (* (random) (y-of p)))
  (translate-coord p 0 (ng dist)))
(def (under p dist)
  (rep dist
       (* (random) (- canvas-height (y-of p))))
  (translate-coord p 0 dist))
(def (left-of p dist)
  (rep dist (* (random) (x-of p)))
  (translate-coord p (ng dist) 0))
(def (right-of p dist)
  (rep dist
       (* (random) (- canvas-width (x-of p))))
  (translate-coord p dist 0))

(def (average l)
  (if (not (list? l)) (set l _arguments))
  (/ (accumulate l + 0) (length l)))

(def (average-of-coords l)
  (if (coord? l) (set l _arguments))
  (let coord-sums
       (accumulate (map cdr l)
                   (! (c val)
                      (list (+ (car val) (car c))
                            (+ (cadr val) (cadr c))))
                   '(0 0)))
  (let len (length l))
  (coord (/ (car coord-sums) len) (/ (cadr coord-sums) len)))

(def (translate object dx dy)
  (cond ((coord? object) (translate-coord object dx dy))
    (#t (print "Unknown object in translate function")
        object)))

(def (coord+vect point vect)
  (translate-coord point (vect 'x) (vect 'y)))

(// def (last l)
  (nth l (- (length l) 1)))
(// def (append l i)
  (concat l (list i)))

(def (accumulate l op val)
  (if (= (length l) 0)
    val
    (accumulate (rest l) op (op (first l) val))))

(def (map op l)
  (def (mapper l op result-l)
    (if (length l)
      (mapper (rest l) op (append result-l (op (first l))))
      result-l))
  (mapper l op '()))

(def (filter op l)
  (def (filterer l op res)
    (if (length l)
      (filterer (rest l) op
        (if (op (first l))
          (append res (first l))
          res))
      res))
  (filterer l op '()))

(def (composite fn-list)
  (if (= (length fn-list) 1)
    (car fn-list)
    (! x ((car fn-list) ((composite (cdr fn-list)) x)))))

(def (list-merge a b op)
  (def (merger a b op res)
    (if (length a)
      (merger (rest a) (rest b) op
        (concat res (list (op (first a) (first b)))))
      res))
  (merger a b op '()))

(def (pair-adjacents l)
  (def (pairer l n res)
    (if (= n (length l))
      res
      (pairer l (++ n)
              (append res
                      (list (nth l (-- n))
                            (nth l n))))))
  (pairer l 1 '()))

(def (join-strings)
  (let sep (first _arguments))
  (let strs (map (! s (if (string? s) s (str-of s)))
             (rest _arguments)))
  (def (joiner sl)
    (cond ((= 0 (length sl)) "")
      ((= 1 (length sl)) (str-concat sep (first sl)))
      (#t (str-concat (first sl) sep (joiner (rest sl))))))
  (joiner strs))

(def (vector x y z)
  (rep z 0)
  (if (list? x)
    (begin
      (set z (nth x 2))
      (set y (nth x 1))
      (set x (nth x 0))))
  (let v (list x y z))
  (def (dispatch tag arg)
    (cond ((= tag #u) v)
      ((= tag 'x) (nth v 0))
      ((= tag 'y) (nth v 1))
      ((= tag 'z) (nth v 2))
      ((or (= tag 'mag) (= tag 'magnitude) (= tag 'size))
        (sqrt (accumulate (map (! (x) (* x x)) v) + 0)))
      ((= tag 'set-x) (set v (list arg y z)))
      ((= tag 'set-y) (set v (list x arg z)))
      ((= tag 'set-z) (set v (list x y arg)))
      ((= tag 'set)
        (if (= (length arg) 2)
          (set v (concat arg 0))
          (set v arg)))
      ((= tag '+) (vector (list-merge v (arg) +)))
      ((= tag '*) (vector
                   (* (dispatch 'x) arg)
                   (* (dispatch 'y) arg)
                   (* (dispatch 'z) arg)))
      ((= tag 'norm) (vector (map (! (i) (/ i (dispatch 'mag))) v)))
      ((= tag 'normalize!) (set v (dispatch 'norm)))
      ((= tag 'dot) (accumulate (list-merge v (arg) *) + 0))
      ((= tag 'cross)
       (vector (- (* (dispatch 'y) (arg 'z))
                  (* (dispatch 'z) (arg 'y)))
               (- (* (dispatch 'z) (arg 'x))
                  (* (dispatch 'x) (arg 'z)))
               (- (* (dispatch 'x) (arg 'y))
                  (* (dispatch 'y) (arg 'x)))))
      ((= tag 'perpendicular)
       (vector (ng y) x z))
      ((= tag 'parallel?)
       (= ((dispatch 'cross arg) 'mag) 0))
      ((= tag 'angle)
        (let x (dispatch 'x)) (let y (dispatch 'y))
        (let a (atan (/ y x)))
        (if (< x 0) (+ a 180)
          (if (< a 0) (+ a (* 2 180)) a)))
      ((= tag 'rotated)
       (vector (- (* x (cos arg)) (* y (sin arg)))
               (+ (* x (sin arg)) (* y (cos arg)))
               z))
      (#t (unknown-tag-notice "vector" tag))))
  dispatch)

(def (mag/dir->vect mag dir)
  (vector (* (cos dir) mag)
          (* (sin dir) mag)))
(def (dir->vect angle) (mag/dir->vect 1 angle))
(def (coords->vect x1 y1 x2 y2) (vector (- x2 x1) (- y2 y1)))
(def (points->vect a b) (vector
                         (- (x-of b) (x-of a))
                         (- (y-of b) (y-of a))))

(def (cline point angle)
  (line point angle #u #f))
(def (cline-from-points x1 y1 x2 y2)
  (line-from-points x1 y1 x2 y2 #u #f))
(def (line-from-points x1 y1 x2 y2 stroke draw?)
  (if (and (coord? x1) (coord? y1))
    (begin
     (let vect (points->vect x1 y1))
     (line x1 (vect 'angle) stroke draw?))
    (line (coord x1 y2)
          ((coords->vect x1 y1 x2 y2) 'angle)
          stroke draw?)))
(def (line point angle stroke draw?)
  (rep point (rand-point)) (rep angle (* 360 (random)))
  (rep draw? #t)
  (def (a tag arg arg2)
    (cond
      ((= tag 'point) point) ((= tag 'angle) angle)
      ((= tag 'vector) (dir->vect angle))
      ((= tag 'intersect)
       ((! (b)
           (let pa (a 'point)) (let pb (b 'point))
           (let va (a 'vector)) (let vb (b 'vector))
           (let ax (x-of pa)) (let ay (y-of pa))
           (let bx (x-of pb)) (let by (y-of pb))
           (let vax (va 'x)) (let vbx (vb 'x))
           (let vay (va 'y)) (let vby (vb 'y))
           (let s (/ (- (+ (* vax ay) (* vay bx))
                        (+ (* vax by) (* vay ax)))
                     (- (* vax vby) (* vay vbx))))
           (if (number? s)
             (coord (+ bx (* s vbx)) (+ by (* s vby)))
             #f)) arg))
      ((= tag 'bound-intersects)
       (filter in-bounds?
               (map (! (bl)
                       (bl 'intersect a))
                    bound-lines)))
      ((= tag 'y-at-x)
       ((! (x)
           (let intersect (a 'intersect
                             (cline (coord x 0) 90)))
           (if (= #f intersect) #f
             (y-of intersect))) arg))
      ((= tag 'x-at-y)
       ((! (y)
           (let intersect (a 'intersect
                             (cline (coord 0 y) 0)))
           (if (= #f intersect) #f
             (x-of intersect))) arg))
      ((= tag 'norm-at-x)
       ((! (x)
           (let nvect ((a 'vector) 'perpendicular))
           (line (coord x (a 'y-at-x x))
                 (nvect 'angle) stroke draw?)) arg))
      ((= tag 'draw)
       (! (stroke)
          (rep stroke (stroke-style))
          (let b-ints (a 'bound-intersects))
          (cond
            ((< (length b-ints) 2)
             (print "Note: line placed outside canvas area")
             #f)
            (#t
             (let bi0 (nth b-ints 0)) (let bi1 (nth b-ints 1))
             (draw "lseg" (x-of bi0) (y-of bi0) (x-of bi1) (y-of bi1)
                   (stroke 'color) (stroke 'width) (stroke 'style))))))
      (#t (unknown-tag-notice "line" tag))))
  (if draw? ((a 'draw) stroke))
  a)

(def (lseg start end stroke draw?)
  (rep start (rand-point)) (rep end (rand-point))
  (rep stroke (stroke-style))
  (rep draw? #t)
  (def (seg tag arg) (cond
    ((= tag 'start) start) ((= tag 'end) end)
    ((= tag 'length) (distance start end))
    ((= tag 'line) (cline-from-points start end))
    ((= tag 'draw)
     (draw "lseg" (x-of start) (y-of start) (x-of end) (y-of end)
           (stroke 'color) (stroke 'width) (stroke 'style)))
    (#t (unknown-tag-notice "lseg" tag))))
  (if draw? (seg 'draw))
  seg)

(def (q-bezier start end control fill stroke)
  (rep start (rand-point)) (rep end (rand-point))
  (rep control (rand-point))
  (rep fill "none") (rep stroke (stroke-style))
  (draw "path"
        (join-strings " "
         "M" (x-of start) (y-of start)
         "Q" (x-of control) (y-of control)
         "," (x-of end) (y-of end))
        fill (stroke 'width) (stroke 'color) (stroke 'style))
  (group q-bez start end control)
  (q-bez start end control))

(def (c-bezier start s-control e-control end fill stroke)
  (rep start (rand-point)) (rep end (rand-point))
  (rep s-control (rand-point))
  (rep e-control (rand-point))
  (rep fill "none") (rep stroke (stroke-style))
  (draw "path"
        (join-strings " "
         "M" (x-of start) (y-of start)
         "C" (x-of s-control) (y-of s-control)
         "," (x-of e-control) (y-of e-control)
         "," (x-of end) (y-of end))
        fill (stroke 'width) (stroke 'color) (stroke 'style))
  (group c-bez start s-control e-control end)
  (c-bez start s-control e-control end))

(def (curve start end s-angle e-angle s-size e-size fill stroke)
  (rep start (rand-point))
  (rep end (rand-point))
  (rep s-angle (* (random) 360))
  (rep e-angle (* (random) 360))
  (rep s-size (* (random) (distance start end)))
  (rep e-size s-size)
  (rep fill "none") (rep stroke (stroke-style))
  (let uv (vector 1 0))
  (let c1 (coord+vect start ((uv 'rotated (ng s-angle)) '* s-size)))
  (let c2 (coord+vect end ((uv 'rotated (ng e-angle)) '* e-size)))
  (draw "path"
        (join-strings " "
                      "M" (x-of start) (y-of start)
                      "C" (x-of c1) (y-of c1)
                      "," (x-of c2) (y-of c2)
                      "," (x-of end) (y-of end))
        fill (stroke 'width) (stroke 'color) (stroke 'style))
  (group crve start end s-angle e-angle s-size e-size)
  (crve start end s-angle e-angle s-size e-size))


(def (arc-from-flags start end r size-flag sweep-flag fill stroke)
  (rep start (rand-point))
  (rep end (rand-point))
  (rep r (* (random) canvas-scale))
  (rep fill "none") (rep stroke (stroke-style))
  (rep sweep-flag #f) (rep size-flag #f)
  (let svg-sweep-flag (if sweep-flag 1 0))
  (let svg-size-flag (if size-flag 1 0))
  (draw "path"
        (join-strings " "
                      "M" (x-of start) (y-of start)
                      "A" r r 0 svg-size-flag svg-sweep-flag
                      (x-of end) (y-of end))
        fill (stroke 'width) (stroke 'color) (stroke 'style))
  (group arc-ff start end r size-flag sweep-flag)
  (arc-ff start end r size-flag sweep-flag))

(def (arc mid r a1 a2 fill stroke)
  (rep mid (rand-point)) (rep r (* (random) canvas-scale))
  (rep a1 (* (random) 360)) (rep a2 (* (random) 360))
  (arc-from-flags
   (coord+vect mid ((vector r 0) 'rotated (ng a1)))
   (coord+vect mid ((vector r 0) 'rotated (ng a2)))
   r (< 180 (- a2 a1)) #f
   fill stroke)
  (group a mid r a1 a2)
  (a mid r a1 a2))

(def (arrow start end stroke angle size)
  (rep angle 45)
  (rep size (/ (distance start end) 6))
  (let scaled-vect (((points->vect start end) 'norm) '* size))
  (let rvect (scaled-vect 'rotated (+ 180 angle)))
  (let lvect (scaled-vect 'rotated (- 180 angle)))
  (lseg end (coord+vect end rvect) stroke)
  (lseg end (coord+vect end lvect) stroke)
  (lseg start end stroke)
  (group arr start end)
  (arr start end))

(def (c-arrow start end s-angle e-angle s-size e-size angle size fill stroke)
  (rep end (rand-point))
  (rep e-angle (* (random) 360))
  (rep fill "none") (rep stroke (stroke-style))
  (rep angle 45) (rep size 10)
  (curve start end s-angle e-angle s-size e-size fill stroke)
  (let scaled-vect ((vector 1 0) '* size))
  (let rvect (scaled-vect 'rotated (+ (ng e-angle) angle)))
  (let lvect (scaled-vect 'rotated (- (ng e-angle) angle)))
  (lseg end (coord+vect end rvect) stroke)
  (lseg end (coord+vect end lvect) stroke)
  (group c-arr start end s-angle e-angle s-size e-size)
  (c-arr start end s-angle e-angle s-size e-size))

(def (arc-arrow mid r a1 a2 angle size stroke)
  (rep mid (rand-point)) (rep r (* (random) (/ canvas-scale 4)))
  (rep a1 (* (random) 360)) (rep a2 (* (random) 360))
  (rep angle 45) (rep size 10)
  (rep stroke (stroke-style))
  (let o (circle (x-of mid) (y-of mid) r (draw?: #f)))
  (let t (o 'tangent a2))
  (let ea (t 'angle))
  (let scaled-vect (vector size 0))
  (let rvect (scaled-vect 'rotated (+ (ng ea) 180 angle)))
  (let lvect (scaled-vect 'rotated (- (ng ea) 180 angle)))
  (let end (coord+vect mid (mag/dir->vect r (ng a2))))
  (arc mid r a1 a2 "none" stroke)
  (lseg end (coord+vect end rvect) stroke)
  (lseg end (coord+vect end lvect) stroke)
  (group arc-arr mid r a1 a2)
  (arc-arr mid r a1 a2))


(def (circle x y r stroke fill draw?)
  (rep x (rand-x)) (rep y (rand-y))
  (rep r (* (random) (/ canvas-scale 3)))
  (rep fill "none") (rep stroke (stroke-style))
  (rep draw? #t)
  (def (O tag arg)
    (cond ((= tag 'x) x) ((= tag 'y) y) ((= tag 'r) r)
      ((or (= tag 'center) (= tag 'point)) (coord x y))
      ((= tag 'point-at-angle)
       (rep arg (* (random) 360))
       (coord (+ x (* (cos arg) r))
              (+ y (* (sin arg) r))))
      ((= tag 'area) (*
        pi (pow r 2)))
      ((= tag 'draw)
       (draw "circle" x y r fill
             (stroke 'width) (stroke 'color) (stroke 'style)))
      ((= tag 'radial-vect)
       (rep arg (* (random) 360))
       (points->vect (O 'center) (O 'point-at-angle arg)))
      ((= tag 'tangent)
       (rep arg (* (random) 360))
       (cline (O 'point-at-angle arg)
              (((O 'radial-vect arg) 'perpendicular) 'angle)))
      (#t (unknown-tag-notice "circle" tag))))
  (if draw? (O 'draw))
  O)

(def (ellipse x y rx ry angle stroke fill draw?)
  (rep x (rand-x)) (rep y (rand-y)) (rep angle 0)
  (rep rx (* (random) (/ canvas-scale 3)))
  (rep ry (* (random) (/ canvas-scale 3)))
  (rep fill "none") (rep stroke (stroke-style))
  (rep draw? #t)
  (def (O tag arg)
    (cond ((= tag 'x) x) ((= tag 'y) y)
      ((or (= tag 'center) (= tag 'point))
       (coord x y))
      ((or (= tag 'rx) (= tag 'width)) rx)
      ((or (= tag 'ry) (= tag 'height)) ry)
      ((= tag 'semi-major) (max rx ry))
      ((= tag 'semi-minor) (min rx ry))
      ((= tag 'eccentricity)
       (let sM (O 'semi-major)) (let sm (O 'semi-minor))
       (- 1 (/ (pow sm 2) (pow sM 2))))
      ((= tag 'diameter-lseg-x)
       (let center (coord x y))
       (let dx (* rx (cos angle))) (let dy (* rx (sin angle)))
       (let right (translate-coord center dx dy))
       (let left (translate-coord center (ng dx) (ng dy)))
       (lseg left right (draw? : #f)))
      ((= tag 'diameter-lseg-y)
       (let center (coord x y))
       (let dx (* ry (sin angle))) (let dy (* ry (cos angle)))
       (let bottom (translate-coord center dx dy))
       (let top (translate-coord center (ng dx) (ng dy)))
       (lseg bottom top (draw? : #f)))
      ((= tag 'major-axis)
       (if (> rx ry)
         (O 'diameter-lseg-x)
         (O 'diameter-lseg-y)))
      ((= tag 'minor-axis)
       (if (< rx ry)
         (O 'diameter-lseg-x)
         (O 'diameter-lseg-y)))
      ((= tag 'draw)
       (draw "ellipse" x y rx ry angle
             fill (stroke 'width) (stroke 'color) (stroke 'style)))
      (#t (unknown-tag-notice "ellipse" tag))))
  (if draw? (O 'draw))
  O)

(def (rect x y width height stroke fill draw?)
  (rep x (rand-x)) (rep y (rand-y))
  (rep width (* (random) (/ canvas-scale 3)))
  (rep height (* (random) (/ canvas-scale 3)))
  (rep fill "none") (rep stroke (stroke-style))
  (rep draw? #t)
  (let corner (coord x y))
  (let points (list corner
                    (right-of corner width)
                    (under (right-of corner width) height)
                    (under corner height)))
  (def (dispatch tag)
    (cond ((= tag 'x) x) ((= tag 'y) y)
      ((or (= tag 'width) (= tag 'w)) width)
      ((or (= tag 'height) (= tag 'h)) height)
      ((or (= tag 'vertices) (= tag 'corners)) points)
      ((= tag 'area) (* height width))
      ((= tag 'draw)
       (draw "polygon" (map cdr points)
             fill (stroke 'width) (stroke 'color) (stroke 'style)))
      (#t (unknown-tag-notice "rect" tag))))
  (if draw? (dispatch 'draw))
  dispatch)

(def (tile width height x y fill draw?)
  (rep fill "black")
  (rect x y width height fill 0 fill draw?))
(def (square-tile size x y fill draw?)
  (rep fill "black")
  (rect x y size size fill 0 fill draw?))

(def (polygon vertices center stroke fill draw?)
  (rep vertices (list (rand-point) (rand-point) (rand-point)))
  (rep center (coord 0 0)) (rep draw? #t)
  (rep fill "none")
  (rep stroke (stroke-style))
  (def (P tag arg)
    (let cx (x-of center)) (let cy (y-of center))
    (cond ((= tag 'vertices) vertices)
      ((or (= tag 'center) (= tag 'point)) center)
      ((= tag 'vertex-coords)
       (map (! (point)
               (translate-coord point cx cy))
            vertices))
      ((= tag 'draw)
       (draw "polygon" (map cdr
                            (map (! (point)
                                    (translate-coord point cx cy))
                                 vertices))
             fill (stroke 'width) (stroke 'color) (stroke 'style)))
      (#t (unknown-tag-notice "polygon" tag))))
  (if draw? (P 'draw))
  P)

(group stroke-style (width 1) (color "black") (style "solid"))
(group text-style (size 16) (color "black") (styling "") (font "Baskerville"))

(let no-stroke (stroke-style (width: 0)))

(def (text content loc style)
  (rep loc (rand-point)) (rep style (text-style))
  (draw-text content (x-of loc) (y-of loc) (style 'styling)
             (style 'size) (style 'color) (style 'font)))

(def (tex content loc size)
  (rep loc (rand-point)) (rep size ((text-style) 'size))
  (draw-tex content (x-of loc) (y-of loc) size))

(def (prints l)
  (if (not (list? l)) (set l _arguments))
  (map print l))

(let canvas-corners (list (coord 0 0)
     (coord canvas-width 0)
     (coord canvas-width canvas-height)
     (coord 0 canvas-height)))

(let canvas-scale (min canvas-height canvas-width))

(def (unknown-tag-notice class tag)
  (prints (str-concat "Unknown tag for " class ":") tag))

(let bound-lines
     (map (! (pair)
             (let p0 (nth pair 0))
             (let p1 (nth pair 1))
             (cline-from-points
              (x-of p0) (y-of p0)
              (x-of p1) (y-of p1)))
          (pair-adjacents
           (append canvas-corners
                   (first canvas-corners)))))

(def (list-col->hex l)
  (str-concat "#"
    (accumulate (map
                 (! cc
                    (let ns (in-base cc 16))
                    (if (= (str-len ns) 1)
                      (set ns (str-concat "0" ns)))
                    ns)
                 l)
                (! (x y) (str-concat y x))
                "")))
(def (hex-col->list hxs)
  (if (= (str-len hxs) 7)
    (map (! s (num-of s 16))
      (list (str-slice hxs 1 3)
            (str-slice hxs 3 5)
            (str-slice hxs 5 7)))
    (print "hex-col->list: cannot parse string of wrong length")))
(def (color-from-scale n col1 start col2 end)
  (let f (min 1 (max 0 (/ (- n start) (- end start)))))
  (list-col->hex (list-merge (hex-col->list col1) (hex-col->list col2)
              (! (sc ec)
                 (round (+ sc (* f (- ec sc))))))))`
