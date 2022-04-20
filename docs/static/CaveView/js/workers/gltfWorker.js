(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
})((function () { 'use strict';

	const DEG2RAD = Math.PI / 180;

	//

	const _lut = [];

	for ( let i = 0; i < 256; i ++ ) {

		_lut[ i ] = ( i < 16 ? '0' : '' ) + ( i ).toString( 16 );

	}

	const hasRandomUUID = typeof crypto !== 'undefined' && 'randomUUID' in crypto;

	function generateUUID() {

		if ( hasRandomUUID ) {

			return crypto.randomUUID().toUpperCase();

		}

		// TODO Remove this code when crypto.randomUUID() is available everywhere
		// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

		const d0 = Math.random() * 0xffffffff | 0;
		const d1 = Math.random() * 0xffffffff | 0;
		const d2 = Math.random() * 0xffffffff | 0;
		const d3 = Math.random() * 0xffffffff | 0;
		const uuid = _lut[ d0 & 0xff ] + _lut[ d0 >> 8 & 0xff ] + _lut[ d0 >> 16 & 0xff ] + _lut[ d0 >> 24 & 0xff ] + '-' +
				_lut[ d1 & 0xff ] + _lut[ d1 >> 8 & 0xff ] + '-' + _lut[ d1 >> 16 & 0x0f | 0x40 ] + _lut[ d1 >> 24 & 0xff ] + '-' +
				_lut[ d2 & 0x3f | 0x80 ] + _lut[ d2 >> 8 & 0xff ] + '-' + _lut[ d2 >> 16 & 0xff ] + _lut[ d2 >> 24 & 0xff ] +
				_lut[ d3 & 0xff ] + _lut[ d3 >> 8 & 0xff ] + _lut[ d3 >> 16 & 0xff ] + _lut[ d3 >> 24 & 0xff ];

		// .toUpperCase() here flattens concatenated strings to save heap memory space.
		return uuid.toUpperCase();

	}

	function clamp( value, min, max ) {

		return Math.max( min, Math.min( max, value ) );

	}

	// compute euclidian modulo of m % n
	// https://en.wikipedia.org/wiki/Modulo_operation
	function euclideanModulo( n, m ) {

		return ( ( n % m ) + m ) % m;

	}

	// https://en.wikipedia.org/wiki/Linear_interpolation
	function lerp( x, y, t ) {

		return ( 1 - t ) * x + t * y;

	}

	function degToRad( degrees ) {

		return degrees * DEG2RAD;

	}

	function isPowerOfTwo( value ) {

		return ( value & ( value - 1 ) ) === 0 && value !== 0;

	}

	function floorPowerOfTwo( value ) {

		return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

	}

	class Quaternion {

		constructor( x = 0, y = 0, z = 0, w = 1 ) {

			this._x = x;
			this._y = y;
			this._z = z;
			this._w = w;

		}

		static slerp( qa, qb, qm, t ) {

			console.warn( 'THREE.Quaternion: Static .slerp() has been deprecated. Use qm.slerpQuaternions( qa, qb, t ) instead.' );
			return qm.slerpQuaternions( qa, qb, t );

		}

		static slerpFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

			// fuzz-free, array-based Quaternion SLERP operation

			let x0 = src0[ srcOffset0 + 0 ],
				y0 = src0[ srcOffset0 + 1 ],
				z0 = src0[ srcOffset0 + 2 ],
				w0 = src0[ srcOffset0 + 3 ];

			const x1 = src1[ srcOffset1 + 0 ],
				y1 = src1[ srcOffset1 + 1 ],
				z1 = src1[ srcOffset1 + 2 ],
				w1 = src1[ srcOffset1 + 3 ];

			if ( t === 0 ) {

				dst[ dstOffset + 0 ] = x0;
				dst[ dstOffset + 1 ] = y0;
				dst[ dstOffset + 2 ] = z0;
				dst[ dstOffset + 3 ] = w0;
				return;

			}

			if ( t === 1 ) {

				dst[ dstOffset + 0 ] = x1;
				dst[ dstOffset + 1 ] = y1;
				dst[ dstOffset + 2 ] = z1;
				dst[ dstOffset + 3 ] = w1;
				return;

			}

			if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

				let s = 1 - t;
				const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
					dir = ( cos >= 0 ? 1 : - 1 ),
					sqrSin = 1 - cos * cos;

				// Skip the Slerp for tiny steps to avoid numeric problems:
				if ( sqrSin > Number.EPSILON ) {

					const sin = Math.sqrt( sqrSin ),
						len = Math.atan2( sin, cos * dir );

					s = Math.sin( s * len ) / sin;
					t = Math.sin( t * len ) / sin;

				}

				const tDir = t * dir;

				x0 = x0 * s + x1 * tDir;
				y0 = y0 * s + y1 * tDir;
				z0 = z0 * s + z1 * tDir;
				w0 = w0 * s + w1 * tDir;

				// Normalize in case we just did a lerp:
				if ( s === 1 - t ) {

					const f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

					x0 *= f;
					y0 *= f;
					z0 *= f;
					w0 *= f;

				}

			}

			dst[ dstOffset ] = x0;
			dst[ dstOffset + 1 ] = y0;
			dst[ dstOffset + 2 ] = z0;
			dst[ dstOffset + 3 ] = w0;

		}

		static multiplyQuaternionsFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

			const x0 = src0[ srcOffset0 ];
			const y0 = src0[ srcOffset0 + 1 ];
			const z0 = src0[ srcOffset0 + 2 ];
			const w0 = src0[ srcOffset0 + 3 ];

			const x1 = src1[ srcOffset1 ];
			const y1 = src1[ srcOffset1 + 1 ];
			const z1 = src1[ srcOffset1 + 2 ];
			const w1 = src1[ srcOffset1 + 3 ];

			dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
			dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
			dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
			dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

			return dst;

		}

		get x() {

			return this._x;

		}

		set x( value ) {

			this._x = value;
			this._onChangeCallback();

		}

		get y() {

			return this._y;

		}

		set y( value ) {

			this._y = value;
			this._onChangeCallback();

		}

		get z() {

			return this._z;

		}

		set z( value ) {

			this._z = value;
			this._onChangeCallback();

		}

		get w() {

			return this._w;

		}

		set w( value ) {

			this._w = value;
			this._onChangeCallback();

		}

		set( x, y, z, w ) {

			this._x = x;
			this._y = y;
			this._z = z;
			this._w = w;

			this._onChangeCallback();

			return this;

		}

		clone() {

			return new this.constructor( this._x, this._y, this._z, this._w );

		}

		copy( quaternion ) {

			this._x = quaternion.x;
			this._y = quaternion.y;
			this._z = quaternion.z;
			this._w = quaternion.w;

			this._onChangeCallback();

			return this;

		}

		setFromEuler( euler, update ) {

			if ( ! ( euler && euler.isEuler ) ) {

				throw new Error( 'THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.' );

			}

			const x = euler._x, y = euler._y, z = euler._z, order = euler._order;

			// http://www.mathworks.com/matlabcentral/fileexchange/
			// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
			//	content/SpinCalc.m

			const cos = Math.cos;
			const sin = Math.sin;

			const c1 = cos( x / 2 );
			const c2 = cos( y / 2 );
			const c3 = cos( z / 2 );

			const s1 = sin( x / 2 );
			const s2 = sin( y / 2 );
			const s3 = sin( z / 2 );

			switch ( order ) {

				case 'XYZ':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'YXZ':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				case 'ZXY':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'ZYX':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				case 'YZX':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'XZY':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				default:
					console.warn( 'THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + order );

			}

			if ( update !== false ) this._onChangeCallback();

			return this;

		}

		setFromAxisAngle( axis, angle ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

			// assumes axis is normalized

			const halfAngle = angle / 2, s = Math.sin( halfAngle );

			this._x = axis.x * s;
			this._y = axis.y * s;
			this._z = axis.z * s;
			this._w = Math.cos( halfAngle );

			this._onChangeCallback();

			return this;

		}

		setFromRotationMatrix( m ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			const te = m.elements,

				m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
				m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
				m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

				trace = m11 + m22 + m33;

			if ( trace > 0 ) {

				const s = 0.5 / Math.sqrt( trace + 1.0 );

				this._w = 0.25 / s;
				this._x = ( m32 - m23 ) * s;
				this._y = ( m13 - m31 ) * s;
				this._z = ( m21 - m12 ) * s;

			} else if ( m11 > m22 && m11 > m33 ) {

				const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

				this._w = ( m32 - m23 ) / s;
				this._x = 0.25 * s;
				this._y = ( m12 + m21 ) / s;
				this._z = ( m13 + m31 ) / s;

			} else if ( m22 > m33 ) {

				const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

				this._w = ( m13 - m31 ) / s;
				this._x = ( m12 + m21 ) / s;
				this._y = 0.25 * s;
				this._z = ( m23 + m32 ) / s;

			} else {

				const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

				this._w = ( m21 - m12 ) / s;
				this._x = ( m13 + m31 ) / s;
				this._y = ( m23 + m32 ) / s;
				this._z = 0.25 * s;

			}

			this._onChangeCallback();

			return this;

		}

		setFromUnitVectors( vFrom, vTo ) {

			// assumes direction vectors vFrom and vTo are normalized

			let r = vFrom.dot( vTo ) + 1;

			if ( r < Number.EPSILON ) {

				// vFrom and vTo point in opposite directions

				r = 0;

				if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

					this._x = - vFrom.y;
					this._y = vFrom.x;
					this._z = 0;
					this._w = r;

				} else {

					this._x = 0;
					this._y = - vFrom.z;
					this._z = vFrom.y;
					this._w = r;

				}

			} else {

				// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

				this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
				this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
				this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
				this._w = r;

			}

			return this.normalize();

		}

		angleTo( q ) {

			return 2 * Math.acos( Math.abs( clamp( this.dot( q ), - 1, 1 ) ) );

		}

		rotateTowards( q, step ) {

			const angle = this.angleTo( q );

			if ( angle === 0 ) return this;

			const t = Math.min( 1, step / angle );

			this.slerp( q, t );

			return this;

		}

		identity() {

			return this.set( 0, 0, 0, 1 );

		}

		invert() {

			// quaternion is assumed to have unit length

			return this.conjugate();

		}

		conjugate() {

			this._x *= - 1;
			this._y *= - 1;
			this._z *= - 1;

			this._onChangeCallback();

			return this;

		}

		dot( v ) {

			return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

		}

		lengthSq() {

			return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

		}

		length() {

			return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

		}

		normalize() {

			let l = this.length();

			if ( l === 0 ) {

				this._x = 0;
				this._y = 0;
				this._z = 0;
				this._w = 1;

			} else {

				l = 1 / l;

				this._x = this._x * l;
				this._y = this._y * l;
				this._z = this._z * l;
				this._w = this._w * l;

			}

			this._onChangeCallback();

			return this;

		}

		multiply( q, p ) {

			if ( p !== undefined ) {

				console.warn( 'THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.' );
				return this.multiplyQuaternions( q, p );

			}

			return this.multiplyQuaternions( this, q );

		}

		premultiply( q ) {

			return this.multiplyQuaternions( q, this );

		}

		multiplyQuaternions( a, b ) {

			// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

			const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
			const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

			this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
			this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
			this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
			this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

			this._onChangeCallback();

			return this;

		}

		slerp( qb, t ) {

			if ( t === 0 ) return this;
			if ( t === 1 ) return this.copy( qb );

			const x = this._x, y = this._y, z = this._z, w = this._w;

			// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

			let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

			if ( cosHalfTheta < 0 ) {

				this._w = - qb._w;
				this._x = - qb._x;
				this._y = - qb._y;
				this._z = - qb._z;

				cosHalfTheta = - cosHalfTheta;

			} else {

				this.copy( qb );

			}

			if ( cosHalfTheta >= 1.0 ) {

				this._w = w;
				this._x = x;
				this._y = y;
				this._z = z;

				return this;

			}

			const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

			if ( sqrSinHalfTheta <= Number.EPSILON ) {

				const s = 1 - t;
				this._w = s * w + t * this._w;
				this._x = s * x + t * this._x;
				this._y = s * y + t * this._y;
				this._z = s * z + t * this._z;

				this.normalize();
				this._onChangeCallback();

				return this;

			}

			const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
			const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
			const ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
				ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

			this._w = ( w * ratioA + this._w * ratioB );
			this._x = ( x * ratioA + this._x * ratioB );
			this._y = ( y * ratioA + this._y * ratioB );
			this._z = ( z * ratioA + this._z * ratioB );

			this._onChangeCallback();

			return this;

		}

		slerpQuaternions( qa, qb, t ) {

			this.copy( qa ).slerp( qb, t );

		}

		random() {

			// Derived from http://planning.cs.uiuc.edu/node198.html
			// Note, this source uses w, x, y, z ordering,
			// so we swap the order below.

			const u1 = Math.random();
			const sqrt1u1 = Math.sqrt( 1 - u1 );
			const sqrtu1 = Math.sqrt( u1 );

			const u2 = 2 * Math.PI * Math.random();

			const u3 = 2 * Math.PI * Math.random();

			return this.set(
				sqrt1u1 * Math.cos( u2 ),
				sqrtu1 * Math.sin( u3 ),
				sqrtu1 * Math.cos( u3 ),
				sqrt1u1 * Math.sin( u2 ),
			);

		}

		equals( quaternion ) {

			return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

		}

		fromArray( array, offset = 0 ) {

			this._x = array[ offset ];
			this._y = array[ offset + 1 ];
			this._z = array[ offset + 2 ];
			this._w = array[ offset + 3 ];

			this._onChangeCallback();

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this._x;
			array[ offset + 1 ] = this._y;
			array[ offset + 2 ] = this._z;
			array[ offset + 3 ] = this._w;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this._x = attribute.getX( index );
			this._y = attribute.getY( index );
			this._z = attribute.getZ( index );
			this._w = attribute.getW( index );

			return this;

		}

		_onChange( callback ) {

			this._onChangeCallback = callback;

			return this;

		}

		_onChangeCallback() {}

	}

	Quaternion.prototype.isQuaternion = true;

	class Vector3 {

		constructor( x = 0, y = 0, z = 0 ) {

			this.x = x;
			this.y = y;
			this.z = z;

		}

		set( x, y, z ) {

			if ( z === undefined ) z = this.z; // sprite.scale.set(x,y)

			this.x = x;
			this.y = y;
			this.z = z;

			return this;

		}

		setScalar( scalar ) {

			this.x = scalar;
			this.y = scalar;
			this.z = scalar;

			return this;

		}

		setX( x ) {

			this.x = x;

			return this;

		}

		setY( y ) {

			this.y = y;

			return this;

		}

		setZ( z ) {

			this.z = z;

			return this;

		}

		setComponent( index, value ) {

			switch ( index ) {

				case 0: this.x = value; break;
				case 1: this.y = value; break;
				case 2: this.z = value; break;
				default: throw new Error( 'index is out of range: ' + index );

			}

			return this;

		}

		getComponent( index ) {

			switch ( index ) {

				case 0: return this.x;
				case 1: return this.y;
				case 2: return this.z;
				default: throw new Error( 'index is out of range: ' + index );

			}

		}

		clone() {

			return new this.constructor( this.x, this.y, this.z );

		}

		copy( v ) {

			this.x = v.x;
			this.y = v.y;
			this.z = v.z;

			return this;

		}

		add( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
				return this.addVectors( v, w );

			}

			this.x += v.x;
			this.y += v.y;
			this.z += v.z;

			return this;

		}

		addScalar( s ) {

			this.x += s;
			this.y += s;
			this.z += s;

			return this;

		}

		addVectors( a, b ) {

			this.x = a.x + b.x;
			this.y = a.y + b.y;
			this.z = a.z + b.z;

			return this;

		}

		addScaledVector( v, s ) {

			this.x += v.x * s;
			this.y += v.y * s;
			this.z += v.z * s;

			return this;

		}

		sub( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
				return this.subVectors( v, w );

			}

			this.x -= v.x;
			this.y -= v.y;
			this.z -= v.z;

			return this;

		}

		subScalar( s ) {

			this.x -= s;
			this.y -= s;
			this.z -= s;

			return this;

		}

		subVectors( a, b ) {

			this.x = a.x - b.x;
			this.y = a.y - b.y;
			this.z = a.z - b.z;

			return this;

		}

		multiply( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.' );
				return this.multiplyVectors( v, w );

			}

			this.x *= v.x;
			this.y *= v.y;
			this.z *= v.z;

			return this;

		}

		multiplyScalar( scalar ) {

			this.x *= scalar;
			this.y *= scalar;
			this.z *= scalar;

			return this;

		}

		multiplyVectors( a, b ) {

			this.x = a.x * b.x;
			this.y = a.y * b.y;
			this.z = a.z * b.z;

			return this;

		}

		applyEuler( euler ) {

			if ( ! ( euler && euler.isEuler ) ) {

				console.error( 'THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.' );

			}

			return this.applyQuaternion( _quaternion$2.setFromEuler( euler ) );

		}

		applyAxisAngle( axis, angle ) {

			return this.applyQuaternion( _quaternion$2.setFromAxisAngle( axis, angle ) );

		}

		applyMatrix3( m ) {

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
			this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
			this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

			return this;

		}

		applyNormalMatrix( m ) {

			return this.applyMatrix3( m ).normalize();

		}

		applyMatrix4( m ) {

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

			this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
			this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
			this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

			return this;

		}

		applyQuaternion( q ) {

			const x = this.x, y = this.y, z = this.z;
			const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

			// calculate quat * vector

			const ix = qw * x + qy * z - qz * y;
			const iy = qw * y + qz * x - qx * z;
			const iz = qw * z + qx * y - qy * x;
			const iw = - qx * x - qy * y - qz * z;

			// calculate result * inverse quat

			this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
			this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
			this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

			return this;

		}

		project( camera ) {

			return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

		}

		unproject( camera ) {

			return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

		}

		transformDirection( m ) {

			// input: THREE.Matrix4 affine matrix
			// vector interpreted as a direction

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
			this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
			this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

			return this.normalize();

		}

		divide( v ) {

			this.x /= v.x;
			this.y /= v.y;
			this.z /= v.z;

			return this;

		}

		divideScalar( scalar ) {

			return this.multiplyScalar( 1 / scalar );

		}

		min( v ) {

			this.x = Math.min( this.x, v.x );
			this.y = Math.min( this.y, v.y );
			this.z = Math.min( this.z, v.z );

			return this;

		}

		max( v ) {

			this.x = Math.max( this.x, v.x );
			this.y = Math.max( this.y, v.y );
			this.z = Math.max( this.z, v.z );

			return this;

		}

		clamp( min, max ) {

			// assumes min < max, componentwise

			this.x = Math.max( min.x, Math.min( max.x, this.x ) );
			this.y = Math.max( min.y, Math.min( max.y, this.y ) );
			this.z = Math.max( min.z, Math.min( max.z, this.z ) );

			return this;

		}

		clampScalar( minVal, maxVal ) {

			this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
			this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
			this.z = Math.max( minVal, Math.min( maxVal, this.z ) );

			return this;

		}

		clampLength( min, max ) {

			const length = this.length();

			return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

		}

		floor() {

			this.x = Math.floor( this.x );
			this.y = Math.floor( this.y );
			this.z = Math.floor( this.z );

			return this;

		}

		ceil() {

			this.x = Math.ceil( this.x );
			this.y = Math.ceil( this.y );
			this.z = Math.ceil( this.z );

			return this;

		}

		round() {

			this.x = Math.round( this.x );
			this.y = Math.round( this.y );
			this.z = Math.round( this.z );

			return this;

		}

		roundToZero() {

			this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
			this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
			this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

			return this;

		}

		negate() {

			this.x = - this.x;
			this.y = - this.y;
			this.z = - this.z;

			return this;

		}

		dot( v ) {

			return this.x * v.x + this.y * v.y + this.z * v.z;

		}

		// TODO lengthSquared?

		lengthSq() {

			return this.x * this.x + this.y * this.y + this.z * this.z;

		}

		length() {

			return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

		}

		manhattanLength() {

			return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

		}

		normalize() {

			return this.divideScalar( this.length() || 1 );

		}

		setLength( length ) {

			return this.normalize().multiplyScalar( length );

		}

		lerp( v, alpha ) {

			this.x += ( v.x - this.x ) * alpha;
			this.y += ( v.y - this.y ) * alpha;
			this.z += ( v.z - this.z ) * alpha;

			return this;

		}

		lerpVectors( v1, v2, alpha ) {

			this.x = v1.x + ( v2.x - v1.x ) * alpha;
			this.y = v1.y + ( v2.y - v1.y ) * alpha;
			this.z = v1.z + ( v2.z - v1.z ) * alpha;

			return this;

		}

		cross( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.' );
				return this.crossVectors( v, w );

			}

			return this.crossVectors( this, v );

		}

		crossVectors( a, b ) {

			const ax = a.x, ay = a.y, az = a.z;
			const bx = b.x, by = b.y, bz = b.z;

			this.x = ay * bz - az * by;
			this.y = az * bx - ax * bz;
			this.z = ax * by - ay * bx;

			return this;

		}

		projectOnVector( v ) {

			const denominator = v.lengthSq();

			if ( denominator === 0 ) return this.set( 0, 0, 0 );

			const scalar = v.dot( this ) / denominator;

			return this.copy( v ).multiplyScalar( scalar );

		}

		projectOnPlane( planeNormal ) {

			_vector$4.copy( this ).projectOnVector( planeNormal );

			return this.sub( _vector$4 );

		}

		reflect( normal ) {

			// reflect incident vector off plane orthogonal to normal
			// normal is assumed to have unit length

			return this.sub( _vector$4.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

		}

		angleTo( v ) {

			const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

			if ( denominator === 0 ) return Math.PI / 2;

			const theta = this.dot( v ) / denominator;

			// clamp, to handle numerical problems

			return Math.acos( clamp( theta, - 1, 1 ) );

		}

		distanceTo( v ) {

			return Math.sqrt( this.distanceToSquared( v ) );

		}

		distanceToSquared( v ) {

			const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

			return dx * dx + dy * dy + dz * dz;

		}

		manhattanDistanceTo( v ) {

			return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

		}

		setFromSpherical( s ) {

			return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

		}

		setFromSphericalCoords( radius, phi, theta ) {

			const sinPhiRadius = Math.sin( phi ) * radius;

			this.x = sinPhiRadius * Math.sin( theta );
			this.y = Math.cos( phi ) * radius;
			this.z = sinPhiRadius * Math.cos( theta );

			return this;

		}

		setFromCylindrical( c ) {

			return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

		}

		setFromCylindricalCoords( radius, theta, y ) {

			this.x = radius * Math.sin( theta );
			this.y = y;
			this.z = radius * Math.cos( theta );

			return this;

		}

		setFromMatrixPosition( m ) {

			const e = m.elements;

			this.x = e[ 12 ];
			this.y = e[ 13 ];
			this.z = e[ 14 ];

			return this;

		}

		setFromMatrixScale( m ) {

			const sx = this.setFromMatrixColumn( m, 0 ).length();
			const sy = this.setFromMatrixColumn( m, 1 ).length();
			const sz = this.setFromMatrixColumn( m, 2 ).length();

			this.x = sx;
			this.y = sy;
			this.z = sz;

			return this;

		}

		setFromMatrixColumn( m, index ) {

			return this.fromArray( m.elements, index * 4 );

		}

		setFromMatrix3Column( m, index ) {

			return this.fromArray( m.elements, index * 3 );

		}

		equals( v ) {

			return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

		}

		fromArray( array, offset = 0 ) {

			this.x = array[ offset ];
			this.y = array[ offset + 1 ];
			this.z = array[ offset + 2 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.x;
			array[ offset + 1 ] = this.y;
			array[ offset + 2 ] = this.z;

			return array;

		}

		fromBufferAttribute( attribute, index, offset ) {

			if ( offset !== undefined ) {

				console.warn( 'THREE.Vector3: offset has been removed from .fromBufferAttribute().' );

			}

			this.x = attribute.getX( index );
			this.y = attribute.getY( index );
			this.z = attribute.getZ( index );

			return this;

		}

		random() {

			this.x = Math.random();
			this.y = Math.random();
			this.z = Math.random();

			return this;

		}

		randomDirection() {

			// Derived from https://mathworld.wolfram.com/SpherePointPicking.html

			const u = ( Math.random() - 0.5 ) * 2;
			const t = Math.random() * Math.PI * 2;
			const f = Math.sqrt( 1 - u ** 2 );

			this.x = f * Math.cos( t );
			this.y = f * Math.sin( t );
			this.z = u;

			return this;

		}

		*[ Symbol.iterator ]() {

			yield this.x;
			yield this.y;
			yield this.z;

		}

	}

	Vector3.prototype.isVector3 = true;

	const _vector$4 = /*@__PURE__*/ new Vector3();
	const _quaternion$2 = /*@__PURE__*/ new Quaternion();

	class Vector2 {

		constructor( x = 0, y = 0 ) {

			this.x = x;
			this.y = y;

		}

		get width() {

			return this.x;

		}

		set width( value ) {

			this.x = value;

		}

		get height() {

			return this.y;

		}

		set height( value ) {

			this.y = value;

		}

		set( x, y ) {

			this.x = x;
			this.y = y;

			return this;

		}

		setScalar( scalar ) {

			this.x = scalar;
			this.y = scalar;

			return this;

		}

		setX( x ) {

			this.x = x;

			return this;

		}

		setY( y ) {

			this.y = y;

			return this;

		}

		setComponent( index, value ) {

			switch ( index ) {

				case 0: this.x = value; break;
				case 1: this.y = value; break;
				default: throw new Error( 'index is out of range: ' + index );

			}

			return this;

		}

		getComponent( index ) {

			switch ( index ) {

				case 0: return this.x;
				case 1: return this.y;
				default: throw new Error( 'index is out of range: ' + index );

			}

		}

		clone() {

			return new this.constructor( this.x, this.y );

		}

		copy( v ) {

			this.x = v.x;
			this.y = v.y;

			return this;

		}

		add( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
				return this.addVectors( v, w );

			}

			this.x += v.x;
			this.y += v.y;

			return this;

		}

		addScalar( s ) {

			this.x += s;
			this.y += s;

			return this;

		}

		addVectors( a, b ) {

			this.x = a.x + b.x;
			this.y = a.y + b.y;

			return this;

		}

		addScaledVector( v, s ) {

			this.x += v.x * s;
			this.y += v.y * s;

			return this;

		}

		sub( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
				return this.subVectors( v, w );

			}

			this.x -= v.x;
			this.y -= v.y;

			return this;

		}

		subScalar( s ) {

			this.x -= s;
			this.y -= s;

			return this;

		}

		subVectors( a, b ) {

			this.x = a.x - b.x;
			this.y = a.y - b.y;

			return this;

		}

		multiply( v ) {

			this.x *= v.x;
			this.y *= v.y;

			return this;

		}

		multiplyScalar( scalar ) {

			this.x *= scalar;
			this.y *= scalar;

			return this;

		}

		divide( v ) {

			this.x /= v.x;
			this.y /= v.y;

			return this;

		}

		divideScalar( scalar ) {

			return this.multiplyScalar( 1 / scalar );

		}

		applyMatrix3( m ) {

			const x = this.x, y = this.y;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ];
			this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ];

			return this;

		}

		min( v ) {

			this.x = Math.min( this.x, v.x );
			this.y = Math.min( this.y, v.y );

			return this;

		}

		max( v ) {

			this.x = Math.max( this.x, v.x );
			this.y = Math.max( this.y, v.y );

			return this;

		}

		clamp( min, max ) {

			// assumes min < max, componentwise

			this.x = Math.max( min.x, Math.min( max.x, this.x ) );
			this.y = Math.max( min.y, Math.min( max.y, this.y ) );

			return this;

		}

		clampScalar( minVal, maxVal ) {

			this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
			this.y = Math.max( minVal, Math.min( maxVal, this.y ) );

			return this;

		}

		clampLength( min, max ) {

			const length = this.length();

			return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

		}

		floor() {

			this.x = Math.floor( this.x );
			this.y = Math.floor( this.y );

			return this;

		}

		ceil() {

			this.x = Math.ceil( this.x );
			this.y = Math.ceil( this.y );

			return this;

		}

		round() {

			this.x = Math.round( this.x );
			this.y = Math.round( this.y );

			return this;

		}

		roundToZero() {

			this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
			this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

			return this;

		}

		negate() {

			this.x = - this.x;
			this.y = - this.y;

			return this;

		}

		dot( v ) {

			return this.x * v.x + this.y * v.y;

		}

		cross( v ) {

			return this.x * v.y - this.y * v.x;

		}

		lengthSq() {

			return this.x * this.x + this.y * this.y;

		}

		length() {

			return Math.sqrt( this.x * this.x + this.y * this.y );

		}

		manhattanLength() {

			return Math.abs( this.x ) + Math.abs( this.y );

		}

		normalize() {

			return this.divideScalar( this.length() || 1 );

		}

		angle() {

			// computes the angle in radians with respect to the positive x-axis

			const angle = Math.atan2( - this.y, - this.x ) + Math.PI;

			return angle;

		}

		distanceTo( v ) {

			return Math.sqrt( this.distanceToSquared( v ) );

		}

		distanceToSquared( v ) {

			const dx = this.x - v.x, dy = this.y - v.y;
			return dx * dx + dy * dy;

		}

		manhattanDistanceTo( v ) {

			return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );

		}

		setLength( length ) {

			return this.normalize().multiplyScalar( length );

		}

		lerp( v, alpha ) {

			this.x += ( v.x - this.x ) * alpha;
			this.y += ( v.y - this.y ) * alpha;

			return this;

		}

		lerpVectors( v1, v2, alpha ) {

			this.x = v1.x + ( v2.x - v1.x ) * alpha;
			this.y = v1.y + ( v2.y - v1.y ) * alpha;

			return this;

		}

		equals( v ) {

			return ( ( v.x === this.x ) && ( v.y === this.y ) );

		}

		fromArray( array, offset = 0 ) {

			this.x = array[ offset ];
			this.y = array[ offset + 1 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.x;
			array[ offset + 1 ] = this.y;

			return array;

		}

		fromBufferAttribute( attribute, index, offset ) {

			if ( offset !== undefined ) {

				console.warn( 'THREE.Vector2: offset has been removed from .fromBufferAttribute().' );

			}

			this.x = attribute.getX( index );
			this.y = attribute.getY( index );

			return this;

		}

		rotateAround( center, angle ) {

			const c = Math.cos( angle ), s = Math.sin( angle );

			const x = this.x - center.x;
			const y = this.y - center.y;

			this.x = x * c - y * s + center.x;
			this.y = x * s + y * c + center.y;

			return this;

		}

		random() {

			this.x = Math.random();
			this.y = Math.random();

			return this;

		}

		*[ Symbol.iterator ]() {

			yield this.x;
			yield this.y;

		}

	}

	Vector2.prototype.isVector2 = true;

	class Box3 {

		constructor( min = new Vector3( + Infinity, + Infinity, + Infinity ), max = new Vector3( - Infinity, - Infinity, - Infinity ) ) {

			this.min = min;
			this.max = max;

		}

		set( min, max ) {

			this.min.copy( min );
			this.max.copy( max );

			return this;

		}

		setFromArray( array ) {

			let minX = + Infinity;
			let minY = + Infinity;
			let minZ = + Infinity;

			let maxX = - Infinity;
			let maxY = - Infinity;
			let maxZ = - Infinity;

			for ( let i = 0, l = array.length; i < l; i += 3 ) {

				const x = array[ i ];
				const y = array[ i + 1 ];
				const z = array[ i + 2 ];

				if ( x < minX ) minX = x;
				if ( y < minY ) minY = y;
				if ( z < minZ ) minZ = z;

				if ( x > maxX ) maxX = x;
				if ( y > maxY ) maxY = y;
				if ( z > maxZ ) maxZ = z;

			}

			this.min.set( minX, minY, minZ );
			this.max.set( maxX, maxY, maxZ );

			return this;

		}

		setFromBufferAttribute( attribute ) {

			let minX = + Infinity;
			let minY = + Infinity;
			let minZ = + Infinity;

			let maxX = - Infinity;
			let maxY = - Infinity;
			let maxZ = - Infinity;

			for ( let i = 0, l = attribute.count; i < l; i ++ ) {

				const x = attribute.getX( i );
				const y = attribute.getY( i );
				const z = attribute.getZ( i );

				if ( x < minX ) minX = x;
				if ( y < minY ) minY = y;
				if ( z < minZ ) minZ = z;

				if ( x > maxX ) maxX = x;
				if ( y > maxY ) maxY = y;
				if ( z > maxZ ) maxZ = z;

			}

			this.min.set( minX, minY, minZ );
			this.max.set( maxX, maxY, maxZ );

			return this;

		}

		setFromPoints( points ) {

			this.makeEmpty();

			for ( let i = 0, il = points.length; i < il; i ++ ) {

				this.expandByPoint( points[ i ] );

			}

			return this;

		}

		setFromCenterAndSize( center, size ) {

			const halfSize = _vector$3.copy( size ).multiplyScalar( 0.5 );

			this.min.copy( center ).sub( halfSize );
			this.max.copy( center ).add( halfSize );

			return this;

		}

		setFromObject( object ) {

			this.makeEmpty();

			return this.expandByObject( object );

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( box ) {

			this.min.copy( box.min );
			this.max.copy( box.max );

			return this;

		}

		makeEmpty() {

			this.min.x = this.min.y = this.min.z = + Infinity;
			this.max.x = this.max.y = this.max.z = - Infinity;

			return this;

		}

		isEmpty() {

			// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

			return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y ) || ( this.max.z < this.min.z );

		}

		getCenter( target ) {

			return this.isEmpty() ? target.set( 0, 0, 0 ) : target.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

		}

		getSize( target ) {

			return this.isEmpty() ? target.set( 0, 0, 0 ) : target.subVectors( this.max, this.min );

		}

		expandByPoint( point ) {

			this.min.min( point );
			this.max.max( point );

			return this;

		}

		expandByVector( vector ) {

			this.min.sub( vector );
			this.max.add( vector );

			return this;

		}

		expandByScalar( scalar ) {

			this.min.addScalar( - scalar );
			this.max.addScalar( scalar );

			return this;

		}

		expandByObject( object ) {

			// Computes the world-axis-aligned bounding box of an object (including its children),
			// accounting for both the object's, and children's, world transforms

			object.updateWorldMatrix( false, false );

			const geometry = object.geometry;

			if ( geometry !== undefined ) {

				if ( geometry.boundingBox === null ) {

					geometry.computeBoundingBox();

				}

				_box$2.copy( geometry.boundingBox );
				_box$2.applyMatrix4( object.matrixWorld );

				this.union( _box$2 );

			}

			const children = object.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				this.expandByObject( children[ i ] );

			}

			return this;

		}

		containsPoint( point ) {

			return point.x < this.min.x || point.x > this.max.x ||
				point.y < this.min.y || point.y > this.max.y ||
				point.z < this.min.z || point.z > this.max.z ? false : true;

		}

		containsBox( box ) {

			return this.min.x <= box.min.x && box.max.x <= this.max.x &&
				this.min.y <= box.min.y && box.max.y <= this.max.y &&
				this.min.z <= box.min.z && box.max.z <= this.max.z;

		}

		getParameter( point, target ) {

			// This can potentially have a divide by zero if the box
			// has a size dimension of 0.

			return target.set(
				( point.x - this.min.x ) / ( this.max.x - this.min.x ),
				( point.y - this.min.y ) / ( this.max.y - this.min.y ),
				( point.z - this.min.z ) / ( this.max.z - this.min.z )
			);

		}

		intersectsBox( box ) {

			// using 6 splitting planes to rule out intersections.
			return box.max.x < this.min.x || box.min.x > this.max.x ||
				box.max.y < this.min.y || box.min.y > this.max.y ||
				box.max.z < this.min.z || box.min.z > this.max.z ? false : true;

		}

		intersectsSphere( sphere ) {

			// Find the point on the AABB closest to the sphere center.
			this.clampPoint( sphere.center, _vector$3 );

			// If that point is inside the sphere, the AABB and sphere intersect.
			return _vector$3.distanceToSquared( sphere.center ) <= ( sphere.radius * sphere.radius );

		}

		intersectsPlane( plane ) {

			// We compute the minimum and maximum dot product values. If those values
			// are on the same side (back or front) of the plane, then there is no intersection.

			let min, max;

			if ( plane.normal.x > 0 ) {

				min = plane.normal.x * this.min.x;
				max = plane.normal.x * this.max.x;

			} else {

				min = plane.normal.x * this.max.x;
				max = plane.normal.x * this.min.x;

			}

			if ( plane.normal.y > 0 ) {

				min += plane.normal.y * this.min.y;
				max += plane.normal.y * this.max.y;

			} else {

				min += plane.normal.y * this.max.y;
				max += plane.normal.y * this.min.y;

			}

			if ( plane.normal.z > 0 ) {

				min += plane.normal.z * this.min.z;
				max += plane.normal.z * this.max.z;

			} else {

				min += plane.normal.z * this.max.z;
				max += plane.normal.z * this.min.z;

			}

			return ( min <= - plane.constant && max >= - plane.constant );

		}

		intersectsTriangle( triangle ) {

			if ( this.isEmpty() ) {

				return false;

			}

			// compute box center and extents
			this.getCenter( _center );
			_extents.subVectors( this.max, _center );

			// translate triangle to aabb origin
			_v0$1.subVectors( triangle.a, _center );
			_v1$4.subVectors( triangle.b, _center );
			_v2$1.subVectors( triangle.c, _center );

			// compute edge vectors for triangle
			_f0.subVectors( _v1$4, _v0$1 );
			_f1.subVectors( _v2$1, _v1$4 );
			_f2.subVectors( _v0$1, _v2$1 );

			// test against axes that are given by cross product combinations of the edges of the triangle and the edges of the aabb
			// make an axis testing of each of the 3 sides of the aabb against each of the 3 sides of the triangle = 9 axis of separation
			// axis_ij = u_i x f_j (u0, u1, u2 = face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
			let axes = [
				0, - _f0.z, _f0.y, 0, - _f1.z, _f1.y, 0, - _f2.z, _f2.y,
				_f0.z, 0, - _f0.x, _f1.z, 0, - _f1.x, _f2.z, 0, - _f2.x,
				- _f0.y, _f0.x, 0, - _f1.y, _f1.x, 0, - _f2.y, _f2.x, 0
			];
			if ( ! satForAxes( axes, _v0$1, _v1$4, _v2$1, _extents ) ) {

				return false;

			}

			// test 3 face normals from the aabb
			axes = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];
			if ( ! satForAxes( axes, _v0$1, _v1$4, _v2$1, _extents ) ) {

				return false;

			}

			// finally testing the face normal of the triangle
			// use already existing triangle edge vectors here
			_triangleNormal.crossVectors( _f0, _f1 );
			axes = [ _triangleNormal.x, _triangleNormal.y, _triangleNormal.z ];

			return satForAxes( axes, _v0$1, _v1$4, _v2$1, _extents );

		}

		clampPoint( point, target ) {

			return target.copy( point ).clamp( this.min, this.max );

		}

		distanceToPoint( point ) {

			const clampedPoint = _vector$3.copy( point ).clamp( this.min, this.max );

			return clampedPoint.sub( point ).length();

		}

		getBoundingSphere( target ) {

			this.getCenter( target.center );

			target.radius = this.getSize( _vector$3 ).length() * 0.5;

			return target;

		}

		intersect( box ) {

			this.min.max( box.min );
			this.max.min( box.max );

			// ensure that if there is no overlap, the result is fully empty, not slightly empty with non-inf/+inf values that will cause subsequence intersects to erroneously return valid values.
			if ( this.isEmpty() ) this.makeEmpty();

			return this;

		}

		union( box ) {

			this.min.min( box.min );
			this.max.max( box.max );

			return this;

		}

		applyMatrix4( matrix ) {

			// transform of empty box is an empty box.
			if ( this.isEmpty() ) return this;

			// NOTE: I am using a binary pattern to specify all 2^3 combinations below
			_points[ 0 ].set( this.min.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 000
			_points[ 1 ].set( this.min.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 001
			_points[ 2 ].set( this.min.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 010
			_points[ 3 ].set( this.min.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 011
			_points[ 4 ].set( this.max.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 100
			_points[ 5 ].set( this.max.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 101
			_points[ 6 ].set( this.max.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 110
			_points[ 7 ].set( this.max.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 111

			this.setFromPoints( _points );

			return this;

		}

		translate( offset ) {

			this.min.add( offset );
			this.max.add( offset );

			return this;

		}

		equals( box ) {

			return box.min.equals( this.min ) && box.max.equals( this.max );

		}

	}

	Box3.prototype.isBox3 = true;

	const _points = [
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3()
	];

	const _vector$3 = /*@__PURE__*/ new Vector3();

	const _box$2 = /*@__PURE__*/ new Box3();

	// triangle centered vertices

	const _v0$1 = /*@__PURE__*/ new Vector3();
	const _v1$4 = /*@__PURE__*/ new Vector3();
	const _v2$1 = /*@__PURE__*/ new Vector3();

	// triangle edge vectors

	const _f0 = /*@__PURE__*/ new Vector3();
	const _f1 = /*@__PURE__*/ new Vector3();
	const _f2 = /*@__PURE__*/ new Vector3();

	const _center = /*@__PURE__*/ new Vector3();
	const _extents = /*@__PURE__*/ new Vector3();
	const _triangleNormal = /*@__PURE__*/ new Vector3();
	const _testAxis = /*@__PURE__*/ new Vector3();

	function satForAxes( axes, v0, v1, v2, extents ) {

		for ( let i = 0, j = axes.length - 3; i <= j; i += 3 ) {

			_testAxis.fromArray( axes, i );
			// project the aabb onto the seperating axis
			const r = extents.x * Math.abs( _testAxis.x ) + extents.y * Math.abs( _testAxis.y ) + extents.z * Math.abs( _testAxis.z );
			// project all 3 vertices of the triangle onto the seperating axis
			const p0 = v0.dot( _testAxis );
			const p1 = v1.dot( _testAxis );
			const p2 = v2.dot( _testAxis );
			// actual test, basically see if either of the most extreme of the triangle points intersects r
			if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

				// points of the projected triangle are outside the projected half-length of the aabb
				// the axis is seperating and we can exit
				return false;

			}

		}

		return true;

	}

	const _box$1 = /*@__PURE__*/ new Box3();
	const _v1$3 = /*@__PURE__*/ new Vector3();
	const _toFarthestPoint = /*@__PURE__*/ new Vector3();
	const _toPoint = /*@__PURE__*/ new Vector3();

	class Sphere {

		constructor( center = new Vector3(), radius = - 1 ) {

			this.center = center;
			this.radius = radius;

		}

		set( center, radius ) {

			this.center.copy( center );
			this.radius = radius;

			return this;

		}

		setFromPoints( points, optionalCenter ) {

			const center = this.center;

			if ( optionalCenter !== undefined ) {

				center.copy( optionalCenter );

			} else {

				_box$1.setFromPoints( points ).getCenter( center );

			}

			let maxRadiusSq = 0;

			for ( let i = 0, il = points.length; i < il; i ++ ) {

				maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( points[ i ] ) );

			}

			this.radius = Math.sqrt( maxRadiusSq );

			return this;

		}

		copy( sphere ) {

			this.center.copy( sphere.center );
			this.radius = sphere.radius;

			return this;

		}

		isEmpty() {

			return ( this.radius < 0 );

		}

		makeEmpty() {

			this.center.set( 0, 0, 0 );
			this.radius = - 1;

			return this;

		}

		containsPoint( point ) {

			return ( point.distanceToSquared( this.center ) <= ( this.radius * this.radius ) );

		}

		distanceToPoint( point ) {

			return ( point.distanceTo( this.center ) - this.radius );

		}

		intersectsSphere( sphere ) {

			const radiusSum = this.radius + sphere.radius;

			return sphere.center.distanceToSquared( this.center ) <= ( radiusSum * radiusSum );

		}

		intersectsBox( box ) {

			return box.intersectsSphere( this );

		}

		intersectsPlane( plane ) {

			return Math.abs( plane.distanceToPoint( this.center ) ) <= this.radius;

		}

		clampPoint( point, target ) {

			const deltaLengthSq = this.center.distanceToSquared( point );

			target.copy( point );

			if ( deltaLengthSq > ( this.radius * this.radius ) ) {

				target.sub( this.center ).normalize();
				target.multiplyScalar( this.radius ).add( this.center );

			}

			return target;

		}

		getBoundingBox( target ) {

			if ( this.isEmpty() ) {

				// Empty sphere produces empty bounding box
				target.makeEmpty();
				return target;

			}

			target.set( this.center, this.center );
			target.expandByScalar( this.radius );

			return target;

		}

		applyMatrix4( matrix ) {

			this.center.applyMatrix4( matrix );
			this.radius = this.radius * matrix.getMaxScaleOnAxis();

			return this;

		}

		translate( offset ) {

			this.center.add( offset );

			return this;

		}

		expandByPoint( point ) {

			// from https://github.com/juj/MathGeoLib/blob/2940b99b99cfe575dd45103ef20f4019dee15b54/src/Geometry/Sphere.cpp#L649-L671

			_toPoint.subVectors( point, this.center );

			const lengthSq = _toPoint.lengthSq();

			if ( lengthSq > ( this.radius * this.radius ) ) {

				const length = Math.sqrt( lengthSq );
				const missingRadiusHalf = ( length - this.radius ) * 0.5;

				// Nudge this sphere towards the target point. Add half the missing distance to radius,
				// and the other half to position. This gives a tighter enclosure, instead of if
				// the whole missing distance were just added to radius.

				this.center.add( _toPoint.multiplyScalar( missingRadiusHalf / length ) );
				this.radius += missingRadiusHalf;

			}

			return this;

		}

		union( sphere ) {

			// from https://github.com/juj/MathGeoLib/blob/2940b99b99cfe575dd45103ef20f4019dee15b54/src/Geometry/Sphere.cpp#L759-L769

			// To enclose another sphere into this sphere, we only need to enclose two points:
			// 1) Enclose the farthest point on the other sphere into this sphere.
			// 2) Enclose the opposite point of the farthest point into this sphere.

			_toFarthestPoint.subVectors( sphere.center, this.center ).normalize().multiplyScalar( sphere.radius );

			this.expandByPoint( _v1$3.copy( sphere.center ).add( _toFarthestPoint ) );
			this.expandByPoint( _v1$3.copy( sphere.center ).sub( _toFarthestPoint ) );

			return this;

		}

		equals( sphere ) {

			return sphere.center.equals( this.center ) && ( sphere.radius === this.radius );

		}

		clone() {

			return new this.constructor().copy( this );

		}

	}

	const _vector$2 = /*@__PURE__*/ new Vector3();
	const _segCenter = /*@__PURE__*/ new Vector3();
	const _segDir = /*@__PURE__*/ new Vector3();
	const _diff = /*@__PURE__*/ new Vector3();

	const _edge1 = /*@__PURE__*/ new Vector3();
	const _edge2 = /*@__PURE__*/ new Vector3();
	const _normal = /*@__PURE__*/ new Vector3();

	class Ray {

		constructor( origin = new Vector3(), direction = new Vector3( 0, 0, - 1 ) ) {

			this.origin = origin;
			this.direction = direction;

		}

		set( origin, direction ) {

			this.origin.copy( origin );
			this.direction.copy( direction );

			return this;

		}

		copy( ray ) {

			this.origin.copy( ray.origin );
			this.direction.copy( ray.direction );

			return this;

		}

		at( t, target ) {

			return target.copy( this.direction ).multiplyScalar( t ).add( this.origin );

		}

		lookAt( v ) {

			this.direction.copy( v ).sub( this.origin ).normalize();

			return this;

		}

		recast( t ) {

			this.origin.copy( this.at( t, _vector$2 ) );

			return this;

		}

		closestPointToPoint( point, target ) {

			target.subVectors( point, this.origin );

			const directionDistance = target.dot( this.direction );

			if ( directionDistance < 0 ) {

				return target.copy( this.origin );

			}

			return target.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

		}

		distanceToPoint( point ) {

			return Math.sqrt( this.distanceSqToPoint( point ) );

		}

		distanceSqToPoint( point ) {

			const directionDistance = _vector$2.subVectors( point, this.origin ).dot( this.direction );

			// point behind the ray

			if ( directionDistance < 0 ) {

				return this.origin.distanceToSquared( point );

			}

			_vector$2.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

			return _vector$2.distanceToSquared( point );

		}

		distanceSqToSegment( v0, v1, optionalPointOnRay, optionalPointOnSegment ) {

			// from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteDistRaySegment.h
			// It returns the min distance between the ray and the segment
			// defined by v0 and v1
			// It can also set two optional targets :
			// - The closest point on the ray
			// - The closest point on the segment

			_segCenter.copy( v0 ).add( v1 ).multiplyScalar( 0.5 );
			_segDir.copy( v1 ).sub( v0 ).normalize();
			_diff.copy( this.origin ).sub( _segCenter );

			const segExtent = v0.distanceTo( v1 ) * 0.5;
			const a01 = - this.direction.dot( _segDir );
			const b0 = _diff.dot( this.direction );
			const b1 = - _diff.dot( _segDir );
			const c = _diff.lengthSq();
			const det = Math.abs( 1 - a01 * a01 );
			let s0, s1, sqrDist, extDet;

			if ( det > 0 ) {

				// The ray and segment are not parallel.

				s0 = a01 * b1 - b0;
				s1 = a01 * b0 - b1;
				extDet = segExtent * det;

				if ( s0 >= 0 ) {

					if ( s1 >= - extDet ) {

						if ( s1 <= extDet ) {

							// region 0
							// Minimum at interior points of ray and segment.

							const invDet = 1 / det;
							s0 *= invDet;
							s1 *= invDet;
							sqrDist = s0 * ( s0 + a01 * s1 + 2 * b0 ) + s1 * ( a01 * s0 + s1 + 2 * b1 ) + c;

						} else {

							// region 1

							s1 = segExtent;
							s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
							sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

						}

					} else {

						// region 5

						s1 = - segExtent;
						s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				} else {

					if ( s1 <= - extDet ) {

						// region 4

						s0 = Math.max( 0, - ( - a01 * segExtent + b0 ) );
						s1 = ( s0 > 0 ) ? - segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					} else if ( s1 <= extDet ) {

						// region 3

						s0 = 0;
						s1 = Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = s1 * ( s1 + 2 * b1 ) + c;

					} else {

						// region 2

						s0 = Math.max( 0, - ( a01 * segExtent + b0 ) );
						s1 = ( s0 > 0 ) ? segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				}

			} else {

				// Ray and segment are parallel.

				s1 = ( a01 > 0 ) ? - segExtent : segExtent;
				s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
				sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

			}

			if ( optionalPointOnRay ) {

				optionalPointOnRay.copy( this.direction ).multiplyScalar( s0 ).add( this.origin );

			}

			if ( optionalPointOnSegment ) {

				optionalPointOnSegment.copy( _segDir ).multiplyScalar( s1 ).add( _segCenter );

			}

			return sqrDist;

		}

		intersectSphere( sphere, target ) {

			_vector$2.subVectors( sphere.center, this.origin );
			const tca = _vector$2.dot( this.direction );
			const d2 = _vector$2.dot( _vector$2 ) - tca * tca;
			const radius2 = sphere.radius * sphere.radius;

			if ( d2 > radius2 ) return null;

			const thc = Math.sqrt( radius2 - d2 );

			// t0 = first intersect point - entrance on front of sphere
			const t0 = tca - thc;

			// t1 = second intersect point - exit point on back of sphere
			const t1 = tca + thc;

			// test to see if both t0 and t1 are behind the ray - if so, return null
			if ( t0 < 0 && t1 < 0 ) return null;

			// test to see if t0 is behind the ray:
			// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
			// in order to always return an intersect point that is in front of the ray.
			if ( t0 < 0 ) return this.at( t1, target );

			// else t0 is in front of the ray, so return the first collision point scaled by t0
			return this.at( t0, target );

		}

		intersectsSphere( sphere ) {

			return this.distanceSqToPoint( sphere.center ) <= ( sphere.radius * sphere.radius );

		}

		distanceToPlane( plane ) {

			const denominator = plane.normal.dot( this.direction );

			if ( denominator === 0 ) {

				// line is coplanar, return origin
				if ( plane.distanceToPoint( this.origin ) === 0 ) {

					return 0;

				}

				// Null is preferable to undefined since undefined means.... it is undefined

				return null;

			}

			const t = - ( this.origin.dot( plane.normal ) + plane.constant ) / denominator;

			// Return if the ray never intersects the plane

			return t >= 0 ? t : null;

		}

		intersectPlane( plane, target ) {

			const t = this.distanceToPlane( plane );

			if ( t === null ) {

				return null;

			}

			return this.at( t, target );

		}

		intersectsPlane( plane ) {

			// check if the ray lies on the plane first

			const distToPoint = plane.distanceToPoint( this.origin );

			if ( distToPoint === 0 ) {

				return true;

			}

			const denominator = plane.normal.dot( this.direction );

			if ( denominator * distToPoint < 0 ) {

				return true;

			}

			// ray origin is behind the plane (and is pointing behind it)

			return false;

		}

		intersectBox( box, target ) {

			let tmin, tmax, tymin, tymax, tzmin, tzmax;

			const invdirx = 1 / this.direction.x,
				invdiry = 1 / this.direction.y,
				invdirz = 1 / this.direction.z;

			const origin = this.origin;

			if ( invdirx >= 0 ) {

				tmin = ( box.min.x - origin.x ) * invdirx;
				tmax = ( box.max.x - origin.x ) * invdirx;

			} else {

				tmin = ( box.max.x - origin.x ) * invdirx;
				tmax = ( box.min.x - origin.x ) * invdirx;

			}

			if ( invdiry >= 0 ) {

				tymin = ( box.min.y - origin.y ) * invdiry;
				tymax = ( box.max.y - origin.y ) * invdiry;

			} else {

				tymin = ( box.max.y - origin.y ) * invdiry;
				tymax = ( box.min.y - origin.y ) * invdiry;

			}

			if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

			// These lines also handle the case where tmin or tmax is NaN
			// (result of 0 * Infinity). x !== x returns true if x is NaN

			if ( tymin > tmin || tmin !== tmin ) tmin = tymin;

			if ( tymax < tmax || tmax !== tmax ) tmax = tymax;

			if ( invdirz >= 0 ) {

				tzmin = ( box.min.z - origin.z ) * invdirz;
				tzmax = ( box.max.z - origin.z ) * invdirz;

			} else {

				tzmin = ( box.max.z - origin.z ) * invdirz;
				tzmax = ( box.min.z - origin.z ) * invdirz;

			}

			if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

			if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

			if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

			//return point closest to the ray (positive side)

			if ( tmax < 0 ) return null;

			return this.at( tmin >= 0 ? tmin : tmax, target );

		}

		intersectsBox( box ) {

			return this.intersectBox( box, _vector$2 ) !== null;

		}

		intersectTriangle( a, b, c, backfaceCulling, target ) {

			// Compute the offset origin, edges, and normal.

			// from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

			_edge1.subVectors( b, a );
			_edge2.subVectors( c, a );
			_normal.crossVectors( _edge1, _edge2 );

			// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
			// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
			//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
			//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
			//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
			let DdN = this.direction.dot( _normal );
			let sign;

			if ( DdN > 0 ) {

				if ( backfaceCulling ) return null;
				sign = 1;

			} else if ( DdN < 0 ) {

				sign = - 1;
				DdN = - DdN;

			} else {

				return null;

			}

			_diff.subVectors( this.origin, a );
			const DdQxE2 = sign * this.direction.dot( _edge2.crossVectors( _diff, _edge2 ) );

			// b1 < 0, no intersection
			if ( DdQxE2 < 0 ) {

				return null;

			}

			const DdE1xQ = sign * this.direction.dot( _edge1.cross( _diff ) );

			// b2 < 0, no intersection
			if ( DdE1xQ < 0 ) {

				return null;

			}

			// b1+b2 > 1, no intersection
			if ( DdQxE2 + DdE1xQ > DdN ) {

				return null;

			}

			// Line intersects triangle, check if ray does.
			const QdN = - sign * _diff.dot( _normal );

			// t < 0, no intersection
			if ( QdN < 0 ) {

				return null;

			}

			// Ray intersects triangle.
			return this.at( QdN / DdN, target );

		}

		applyMatrix4( matrix4 ) {

			this.origin.applyMatrix4( matrix4 );
			this.direction.transformDirection( matrix4 );

			return this;

		}

		equals( ray ) {

			return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

		}

		clone() {

			return new this.constructor().copy( this );

		}

	}

	class Matrix4 {

		constructor() {

			this.elements = [

				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1

			];

			if ( arguments.length > 0 ) {

				console.error( 'THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.' );

			}

		}

		set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

			const te = this.elements;

			te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
			te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
			te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
			te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

			return this;

		}

		identity() {

			this.set(

				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1

			);

			return this;

		}

		clone() {

			return new Matrix4().fromArray( this.elements );

		}

		copy( m ) {

			const te = this.elements;
			const me = m.elements;

			te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ]; te[ 3 ] = me[ 3 ];
			te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ]; te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ];
			te[ 8 ] = me[ 8 ]; te[ 9 ] = me[ 9 ]; te[ 10 ] = me[ 10 ]; te[ 11 ] = me[ 11 ];
			te[ 12 ] = me[ 12 ]; te[ 13 ] = me[ 13 ]; te[ 14 ] = me[ 14 ]; te[ 15 ] = me[ 15 ];

			return this;

		}

		copyPosition( m ) {

			const te = this.elements, me = m.elements;

			te[ 12 ] = me[ 12 ];
			te[ 13 ] = me[ 13 ];
			te[ 14 ] = me[ 14 ];

			return this;

		}

		setFromMatrix3( m ) {

			const me = m.elements;

			this.set(

				me[ 0 ], me[ 3 ], me[ 6 ], 0,
				me[ 1 ], me[ 4 ], me[ 7 ], 0,
				me[ 2 ], me[ 5 ], me[ 8 ], 0,
				0, 0, 0, 1

			);

			return this;

		}

		extractBasis( xAxis, yAxis, zAxis ) {

			xAxis.setFromMatrixColumn( this, 0 );
			yAxis.setFromMatrixColumn( this, 1 );
			zAxis.setFromMatrixColumn( this, 2 );

			return this;

		}

		makeBasis( xAxis, yAxis, zAxis ) {

			this.set(
				xAxis.x, yAxis.x, zAxis.x, 0,
				xAxis.y, yAxis.y, zAxis.y, 0,
				xAxis.z, yAxis.z, zAxis.z, 0,
				0, 0, 0, 1
			);

			return this;

		}

		extractRotation( m ) {

			// this method does not support reflection matrices

			const te = this.elements;
			const me = m.elements;

			const scaleX = 1 / _v1$2.setFromMatrixColumn( m, 0 ).length();
			const scaleY = 1 / _v1$2.setFromMatrixColumn( m, 1 ).length();
			const scaleZ = 1 / _v1$2.setFromMatrixColumn( m, 2 ).length();

			te[ 0 ] = me[ 0 ] * scaleX;
			te[ 1 ] = me[ 1 ] * scaleX;
			te[ 2 ] = me[ 2 ] * scaleX;
			te[ 3 ] = 0;

			te[ 4 ] = me[ 4 ] * scaleY;
			te[ 5 ] = me[ 5 ] * scaleY;
			te[ 6 ] = me[ 6 ] * scaleY;
			te[ 7 ] = 0;

			te[ 8 ] = me[ 8 ] * scaleZ;
			te[ 9 ] = me[ 9 ] * scaleZ;
			te[ 10 ] = me[ 10 ] * scaleZ;
			te[ 11 ] = 0;

			te[ 12 ] = 0;
			te[ 13 ] = 0;
			te[ 14 ] = 0;
			te[ 15 ] = 1;

			return this;

		}

		makeRotationFromEuler( euler ) {

			if ( ! ( euler && euler.isEuler ) ) {

				console.error( 'THREE.Matrix4: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.' );

			}

			const te = this.elements;

			const x = euler.x, y = euler.y, z = euler.z;
			const a = Math.cos( x ), b = Math.sin( x );
			const c = Math.cos( y ), d = Math.sin( y );
			const e = Math.cos( z ), f = Math.sin( z );

			if ( euler.order === 'XYZ' ) {

				const ae = a * e, af = a * f, be = b * e, bf = b * f;

				te[ 0 ] = c * e;
				te[ 4 ] = - c * f;
				te[ 8 ] = d;

				te[ 1 ] = af + be * d;
				te[ 5 ] = ae - bf * d;
				te[ 9 ] = - b * c;

				te[ 2 ] = bf - ae * d;
				te[ 6 ] = be + af * d;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'YXZ' ) {

				const ce = c * e, cf = c * f, de = d * e, df = d * f;

				te[ 0 ] = ce + df * b;
				te[ 4 ] = de * b - cf;
				te[ 8 ] = a * d;

				te[ 1 ] = a * f;
				te[ 5 ] = a * e;
				te[ 9 ] = - b;

				te[ 2 ] = cf * b - de;
				te[ 6 ] = df + ce * b;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'ZXY' ) {

				const ce = c * e, cf = c * f, de = d * e, df = d * f;

				te[ 0 ] = ce - df * b;
				te[ 4 ] = - a * f;
				te[ 8 ] = de + cf * b;

				te[ 1 ] = cf + de * b;
				te[ 5 ] = a * e;
				te[ 9 ] = df - ce * b;

				te[ 2 ] = - a * d;
				te[ 6 ] = b;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'ZYX' ) {

				const ae = a * e, af = a * f, be = b * e, bf = b * f;

				te[ 0 ] = c * e;
				te[ 4 ] = be * d - af;
				te[ 8 ] = ae * d + bf;

				te[ 1 ] = c * f;
				te[ 5 ] = bf * d + ae;
				te[ 9 ] = af * d - be;

				te[ 2 ] = - d;
				te[ 6 ] = b * c;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'YZX' ) {

				const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

				te[ 0 ] = c * e;
				te[ 4 ] = bd - ac * f;
				te[ 8 ] = bc * f + ad;

				te[ 1 ] = f;
				te[ 5 ] = a * e;
				te[ 9 ] = - b * e;

				te[ 2 ] = - d * e;
				te[ 6 ] = ad * f + bc;
				te[ 10 ] = ac - bd * f;

			} else if ( euler.order === 'XZY' ) {

				const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

				te[ 0 ] = c * e;
				te[ 4 ] = - f;
				te[ 8 ] = d * e;

				te[ 1 ] = ac * f + bd;
				te[ 5 ] = a * e;
				te[ 9 ] = ad * f - bc;

				te[ 2 ] = bc * f - ad;
				te[ 6 ] = b * e;
				te[ 10 ] = bd * f + ac;

			}

			// bottom row
			te[ 3 ] = 0;
			te[ 7 ] = 0;
			te[ 11 ] = 0;

			// last column
			te[ 12 ] = 0;
			te[ 13 ] = 0;
			te[ 14 ] = 0;
			te[ 15 ] = 1;

			return this;

		}

		makeRotationFromQuaternion( q ) {

			return this.compose( _zero, q, _one );

		}

		lookAt( eye, target, up ) {

			const te = this.elements;

			_z.subVectors( eye, target );

			if ( _z.lengthSq() === 0 ) {

				// eye and target are in the same position

				_z.z = 1;

			}

			_z.normalize();
			_x.crossVectors( up, _z );

			if ( _x.lengthSq() === 0 ) {

				// up and z are parallel

				if ( Math.abs( up.z ) === 1 ) {

					_z.x += 0.0001;

				} else {

					_z.z += 0.0001;

				}

				_z.normalize();
				_x.crossVectors( up, _z );

			}

			_x.normalize();
			_y.crossVectors( _z, _x );

			te[ 0 ] = _x.x; te[ 4 ] = _y.x; te[ 8 ] = _z.x;
			te[ 1 ] = _x.y; te[ 5 ] = _y.y; te[ 9 ] = _z.y;
			te[ 2 ] = _x.z; te[ 6 ] = _y.z; te[ 10 ] = _z.z;

			return this;

		}

		multiply( m, n ) {

			if ( n !== undefined ) {

				console.warn( 'THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead.' );
				return this.multiplyMatrices( m, n );

			}

			return this.multiplyMatrices( this, m );

		}

		premultiply( m ) {

			return this.multiplyMatrices( m, this );

		}

		multiplyMatrices( a, b ) {

			const ae = a.elements;
			const be = b.elements;
			const te = this.elements;

			const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
			const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
			const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
			const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

			const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
			const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
			const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
			const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

			te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
			te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
			te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
			te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

			te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
			te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
			te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
			te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

			te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
			te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
			te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
			te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

			te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
			te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
			te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
			te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

			return this;

		}

		multiplyScalar( s ) {

			const te = this.elements;

			te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
			te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
			te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
			te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

			return this;

		}

		determinant() {

			const te = this.elements;

			const n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
			const n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
			const n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
			const n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

			//TODO: make this more efficient
			//( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

			return (
				n41 * (
					+ n14 * n23 * n32
					 - n13 * n24 * n32
					 - n14 * n22 * n33
					 + n12 * n24 * n33
					 + n13 * n22 * n34
					 - n12 * n23 * n34
				) +
				n42 * (
					+ n11 * n23 * n34
					 - n11 * n24 * n33
					 + n14 * n21 * n33
					 - n13 * n21 * n34
					 + n13 * n24 * n31
					 - n14 * n23 * n31
				) +
				n43 * (
					+ n11 * n24 * n32
					 - n11 * n22 * n34
					 - n14 * n21 * n32
					 + n12 * n21 * n34
					 + n14 * n22 * n31
					 - n12 * n24 * n31
				) +
				n44 * (
					- n13 * n22 * n31
					 - n11 * n23 * n32
					 + n11 * n22 * n33
					 + n13 * n21 * n32
					 - n12 * n21 * n33
					 + n12 * n23 * n31
				)

			);

		}

		transpose() {

			const te = this.elements;
			let tmp;

			tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
			tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
			tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

			tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
			tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
			tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

			return this;

		}

		setPosition( x, y, z ) {

			const te = this.elements;

			if ( x.isVector3 ) {

				te[ 12 ] = x.x;
				te[ 13 ] = x.y;
				te[ 14 ] = x.z;

			} else {

				te[ 12 ] = x;
				te[ 13 ] = y;
				te[ 14 ] = z;

			}

			return this;

		}

		invert() {

			// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
			const te = this.elements,

				n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ], n41 = te[ 3 ],
				n12 = te[ 4 ], n22 = te[ 5 ], n32 = te[ 6 ], n42 = te[ 7 ],
				n13 = te[ 8 ], n23 = te[ 9 ], n33 = te[ 10 ], n43 = te[ 11 ],
				n14 = te[ 12 ], n24 = te[ 13 ], n34 = te[ 14 ], n44 = te[ 15 ],

				t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
				t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
				t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
				t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

			const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

			if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 );

			const detInv = 1 / det;

			te[ 0 ] = t11 * detInv;
			te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
			te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
			te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

			te[ 4 ] = t12 * detInv;
			te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
			te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
			te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

			te[ 8 ] = t13 * detInv;
			te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
			te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
			te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

			te[ 12 ] = t14 * detInv;
			te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
			te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
			te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

			return this;

		}

		scale( v ) {

			const te = this.elements;
			const x = v.x, y = v.y, z = v.z;

			te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
			te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
			te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
			te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

			return this;

		}

		getMaxScaleOnAxis() {

			const te = this.elements;

			const scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
			const scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
			const scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

			return Math.sqrt( Math.max( scaleXSq, scaleYSq, scaleZSq ) );

		}

		makeTranslation( x, y, z ) {

			this.set(

				1, 0, 0, x,
				0, 1, 0, y,
				0, 0, 1, z,
				0, 0, 0, 1

			);

			return this;

		}

		makeRotationX( theta ) {

			const c = Math.cos( theta ), s = Math.sin( theta );

			this.set(

				1, 0, 0, 0,
				0, c, - s, 0,
				0, s, c, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeRotationY( theta ) {

			const c = Math.cos( theta ), s = Math.sin( theta );

			this.set(

				 c, 0, s, 0,
				 0, 1, 0, 0,
				- s, 0, c, 0,
				 0, 0, 0, 1

			);

			return this;

		}

		makeRotationZ( theta ) {

			const c = Math.cos( theta ), s = Math.sin( theta );

			this.set(

				c, - s, 0, 0,
				s, c, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeRotationAxis( axis, angle ) {

			// Based on http://www.gamedev.net/reference/articles/article1199.asp

			const c = Math.cos( angle );
			const s = Math.sin( angle );
			const t = 1 - c;
			const x = axis.x, y = axis.y, z = axis.z;
			const tx = t * x, ty = t * y;

			this.set(

				tx * x + c, tx * y - s * z, tx * z + s * y, 0,
				tx * y + s * z, ty * y + c, ty * z - s * x, 0,
				tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeScale( x, y, z ) {

			this.set(

				x, 0, 0, 0,
				0, y, 0, 0,
				0, 0, z, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeShear( xy, xz, yx, yz, zx, zy ) {

			this.set(

				1, yx, zx, 0,
				xy, 1, zy, 0,
				xz, yz, 1, 0,
				0, 0, 0, 1

			);

			return this;

		}

		compose( position, quaternion, scale ) {

			const te = this.elements;

			const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
			const x2 = x + x,	y2 = y + y, z2 = z + z;
			const xx = x * x2, xy = x * y2, xz = x * z2;
			const yy = y * y2, yz = y * z2, zz = z * z2;
			const wx = w * x2, wy = w * y2, wz = w * z2;

			const sx = scale.x, sy = scale.y, sz = scale.z;

			te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
			te[ 1 ] = ( xy + wz ) * sx;
			te[ 2 ] = ( xz - wy ) * sx;
			te[ 3 ] = 0;

			te[ 4 ] = ( xy - wz ) * sy;
			te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
			te[ 6 ] = ( yz + wx ) * sy;
			te[ 7 ] = 0;

			te[ 8 ] = ( xz + wy ) * sz;
			te[ 9 ] = ( yz - wx ) * sz;
			te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
			te[ 11 ] = 0;

			te[ 12 ] = position.x;
			te[ 13 ] = position.y;
			te[ 14 ] = position.z;
			te[ 15 ] = 1;

			return this;

		}

		decompose( position, quaternion, scale ) {

			const te = this.elements;

			let sx = _v1$2.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
			const sy = _v1$2.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
			const sz = _v1$2.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

			// if determine is negative, we need to invert one scale
			const det = this.determinant();
			if ( det < 0 ) sx = - sx;

			position.x = te[ 12 ];
			position.y = te[ 13 ];
			position.z = te[ 14 ];

			// scale the rotation part
			_m1$2.copy( this );

			const invSX = 1 / sx;
			const invSY = 1 / sy;
			const invSZ = 1 / sz;

			_m1$2.elements[ 0 ] *= invSX;
			_m1$2.elements[ 1 ] *= invSX;
			_m1$2.elements[ 2 ] *= invSX;

			_m1$2.elements[ 4 ] *= invSY;
			_m1$2.elements[ 5 ] *= invSY;
			_m1$2.elements[ 6 ] *= invSY;

			_m1$2.elements[ 8 ] *= invSZ;
			_m1$2.elements[ 9 ] *= invSZ;
			_m1$2.elements[ 10 ] *= invSZ;

			quaternion.setFromRotationMatrix( _m1$2 );

			scale.x = sx;
			scale.y = sy;
			scale.z = sz;

			return this;

		}

		makePerspective( left, right, top, bottom, near, far ) {

			if ( far === undefined ) {

				console.warn( 'THREE.Matrix4: .makePerspective() has been redefined and has a new signature. Please check the docs.' );

			}

			const te = this.elements;
			const x = 2 * near / ( right - left );
			const y = 2 * near / ( top - bottom );

			const a = ( right + left ) / ( right - left );
			const b = ( top + bottom ) / ( top - bottom );
			const c = - ( far + near ) / ( far - near );
			const d = - 2 * far * near / ( far - near );

			te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a;	te[ 12 ] = 0;
			te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b;	te[ 13 ] = 0;
			te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c;	te[ 14 ] = d;
			te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = - 1;	te[ 15 ] = 0;

			return this;

		}

		makeOrthographic( left, right, top, bottom, near, far ) {

			const te = this.elements;
			const w = 1.0 / ( right - left );
			const h = 1.0 / ( top - bottom );
			const p = 1.0 / ( far - near );

			const x = ( right + left ) * w;
			const y = ( top + bottom ) * h;
			const z = ( far + near ) * p;

			te[ 0 ] = 2 * w;	te[ 4 ] = 0;	te[ 8 ] = 0;	te[ 12 ] = - x;
			te[ 1 ] = 0;	te[ 5 ] = 2 * h;	te[ 9 ] = 0;	te[ 13 ] = - y;
			te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = - 2 * p;	te[ 14 ] = - z;
			te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = 0;	te[ 15 ] = 1;

			return this;

		}

		equals( matrix ) {

			const te = this.elements;
			const me = matrix.elements;

			for ( let i = 0; i < 16; i ++ ) {

				if ( te[ i ] !== me[ i ] ) return false;

			}

			return true;

		}

		fromArray( array, offset = 0 ) {

			for ( let i = 0; i < 16; i ++ ) {

				this.elements[ i ] = array[ i + offset ];

			}

			return this;

		}

		toArray( array = [], offset = 0 ) {

			const te = this.elements;

			array[ offset ] = te[ 0 ];
			array[ offset + 1 ] = te[ 1 ];
			array[ offset + 2 ] = te[ 2 ];
			array[ offset + 3 ] = te[ 3 ];

			array[ offset + 4 ] = te[ 4 ];
			array[ offset + 5 ] = te[ 5 ];
			array[ offset + 6 ] = te[ 6 ];
			array[ offset + 7 ] = te[ 7 ];

			array[ offset + 8 ] = te[ 8 ];
			array[ offset + 9 ] = te[ 9 ];
			array[ offset + 10 ] = te[ 10 ];
			array[ offset + 11 ] = te[ 11 ];

			array[ offset + 12 ] = te[ 12 ];
			array[ offset + 13 ] = te[ 13 ];
			array[ offset + 14 ] = te[ 14 ];
			array[ offset + 15 ] = te[ 15 ];

			return array;

		}

	}

	Matrix4.prototype.isMatrix4 = true;

	const _v1$2 = /*@__PURE__*/ new Vector3();
	const _m1$2 = /*@__PURE__*/ new Matrix4();
	const _zero = /*@__PURE__*/ new Vector3( 0, 0, 0 );
	const _one = /*@__PURE__*/ new Vector3( 1, 1, 1 );
	const _x = /*@__PURE__*/ new Vector3();
	const _y = /*@__PURE__*/ new Vector3();
	const _z = /*@__PURE__*/ new Vector3();

	/**
	 * https://github.com/mrdoob/eventdispatcher.js/
	 */

	class EventDispatcher {

		addEventListener( type, listener ) {

			if ( this._listeners === undefined ) this._listeners = {};

			const listeners = this._listeners;

			if ( listeners[ type ] === undefined ) {

				listeners[ type ] = [];

			}

			if ( listeners[ type ].indexOf( listener ) === - 1 ) {

				listeners[ type ].push( listener );

			}

		}

		hasEventListener( type, listener ) {

			if ( this._listeners === undefined ) return false;

			const listeners = this._listeners;

			return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;

		}

		removeEventListener( type, listener ) {

			if ( this._listeners === undefined ) return;

			const listeners = this._listeners;
			const listenerArray = listeners[ type ];

			if ( listenerArray !== undefined ) {

				const index = listenerArray.indexOf( listener );

				if ( index !== - 1 ) {

					listenerArray.splice( index, 1 );

				}

			}

		}

		dispatchEvent( event ) {

			if ( this._listeners === undefined ) return;

			const listeners = this._listeners;
			const listenerArray = listeners[ event.type ];

			if ( listenerArray !== undefined ) {

				event.target = this;

				// Make a copy, in case listeners are removed while iterating.
				const array = listenerArray.slice( 0 );

				for ( let i = 0, l = array.length; i < l; i ++ ) {

					array[ i ].call( this, event );

				}

				event.target = null;

			}

		}

	}

	const _matrix = /*@__PURE__*/ new Matrix4();
	const _quaternion$1 = /*@__PURE__*/ new Quaternion();

	class Euler {

		constructor( x = 0, y = 0, z = 0, order = Euler.DefaultOrder ) {

			this._x = x;
			this._y = y;
			this._z = z;
			this._order = order;

		}

		get x() {

			return this._x;

		}

		set x( value ) {

			this._x = value;
			this._onChangeCallback();

		}

		get y() {

			return this._y;

		}

		set y( value ) {

			this._y = value;
			this._onChangeCallback();

		}

		get z() {

			return this._z;

		}

		set z( value ) {

			this._z = value;
			this._onChangeCallback();

		}

		get order() {

			return this._order;

		}

		set order( value ) {

			this._order = value;
			this._onChangeCallback();

		}

		set( x, y, z, order = this._order ) {

			this._x = x;
			this._y = y;
			this._z = z;
			this._order = order;

			this._onChangeCallback();

			return this;

		}

		clone() {

			return new this.constructor( this._x, this._y, this._z, this._order );

		}

		copy( euler ) {

			this._x = euler._x;
			this._y = euler._y;
			this._z = euler._z;
			this._order = euler._order;

			this._onChangeCallback();

			return this;

		}

		setFromRotationMatrix( m, order = this._order, update = true ) {

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			const te = m.elements;
			const m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
			const m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
			const m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

			switch ( order ) {

				case 'XYZ':

					this._y = Math.asin( clamp( m13, - 1, 1 ) );

					if ( Math.abs( m13 ) < 0.9999999 ) {

						this._x = Math.atan2( - m23, m33 );
						this._z = Math.atan2( - m12, m11 );

					} else {

						this._x = Math.atan2( m32, m22 );
						this._z = 0;

					}

					break;

				case 'YXZ':

					this._x = Math.asin( - clamp( m23, - 1, 1 ) );

					if ( Math.abs( m23 ) < 0.9999999 ) {

						this._y = Math.atan2( m13, m33 );
						this._z = Math.atan2( m21, m22 );

					} else {

						this._y = Math.atan2( - m31, m11 );
						this._z = 0;

					}

					break;

				case 'ZXY':

					this._x = Math.asin( clamp( m32, - 1, 1 ) );

					if ( Math.abs( m32 ) < 0.9999999 ) {

						this._y = Math.atan2( - m31, m33 );
						this._z = Math.atan2( - m12, m22 );

					} else {

						this._y = 0;
						this._z = Math.atan2( m21, m11 );

					}

					break;

				case 'ZYX':

					this._y = Math.asin( - clamp( m31, - 1, 1 ) );

					if ( Math.abs( m31 ) < 0.9999999 ) {

						this._x = Math.atan2( m32, m33 );
						this._z = Math.atan2( m21, m11 );

					} else {

						this._x = 0;
						this._z = Math.atan2( - m12, m22 );

					}

					break;

				case 'YZX':

					this._z = Math.asin( clamp( m21, - 1, 1 ) );

					if ( Math.abs( m21 ) < 0.9999999 ) {

						this._x = Math.atan2( - m23, m22 );
						this._y = Math.atan2( - m31, m11 );

					} else {

						this._x = 0;
						this._y = Math.atan2( m13, m33 );

					}

					break;

				case 'XZY':

					this._z = Math.asin( - clamp( m12, - 1, 1 ) );

					if ( Math.abs( m12 ) < 0.9999999 ) {

						this._x = Math.atan2( m32, m22 );
						this._y = Math.atan2( m13, m11 );

					} else {

						this._x = Math.atan2( - m23, m33 );
						this._y = 0;

					}

					break;

				default:

					console.warn( 'THREE.Euler: .setFromRotationMatrix() encountered an unknown order: ' + order );

			}

			this._order = order;

			if ( update === true ) this._onChangeCallback();

			return this;

		}

		setFromQuaternion( q, order, update ) {

			_matrix.makeRotationFromQuaternion( q );

			return this.setFromRotationMatrix( _matrix, order, update );

		}

		setFromVector3( v, order = this._order ) {

			return this.set( v.x, v.y, v.z, order );

		}

		reorder( newOrder ) {

			// WARNING: this discards revolution information -bhouston

			_quaternion$1.setFromEuler( this );

			return this.setFromQuaternion( _quaternion$1, newOrder );

		}

		equals( euler ) {

			return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

		}

		fromArray( array ) {

			this._x = array[ 0 ];
			this._y = array[ 1 ];
			this._z = array[ 2 ];
			if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

			this._onChangeCallback();

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this._x;
			array[ offset + 1 ] = this._y;
			array[ offset + 2 ] = this._z;
			array[ offset + 3 ] = this._order;

			return array;

		}

		toVector3( optionalResult ) {

			if ( optionalResult ) {

				return optionalResult.set( this._x, this._y, this._z );

			} else {

				return new Vector3( this._x, this._y, this._z );

			}

		}

		_onChange( callback ) {

			this._onChangeCallback = callback;

			return this;

		}

		_onChangeCallback() {}

	}

	Euler.prototype.isEuler = true;

	Euler.DefaultOrder = 'XYZ';
	Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

	class Layers {

		constructor() {

			this.mask = 1 | 0;

		}

		set( channel ) {

			this.mask = 1 << channel | 0;

		}

		enable( channel ) {

			this.mask |= 1 << channel | 0;

		}

		enableAll() {

			this.mask = 0xffffffff | 0;

		}

		toggle( channel ) {

			this.mask ^= 1 << channel | 0;

		}

		disable( channel ) {

			this.mask &= ~ ( 1 << channel | 0 );

		}

		disableAll() {

			this.mask = 0;

		}

		test( layers ) {

			return ( this.mask & layers.mask ) !== 0;

		}

	}

	class Matrix3 {

		constructor() {

			this.elements = [

				1, 0, 0,
				0, 1, 0,
				0, 0, 1

			];

			if ( arguments.length > 0 ) {

				console.error( 'THREE.Matrix3: the constructor no longer reads arguments. use .set() instead.' );

			}

		}

		set( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

			const te = this.elements;

			te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
			te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
			te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

			return this;

		}

		identity() {

			this.set(

				1, 0, 0,
				0, 1, 0,
				0, 0, 1

			);

			return this;

		}

		copy( m ) {

			const te = this.elements;
			const me = m.elements;

			te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
			te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
			te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

			return this;

		}

		extractBasis( xAxis, yAxis, zAxis ) {

			xAxis.setFromMatrix3Column( this, 0 );
			yAxis.setFromMatrix3Column( this, 1 );
			zAxis.setFromMatrix3Column( this, 2 );

			return this;

		}

		setFromMatrix4( m ) {

			const me = m.elements;

			this.set(

				me[ 0 ], me[ 4 ], me[ 8 ],
				me[ 1 ], me[ 5 ], me[ 9 ],
				me[ 2 ], me[ 6 ], me[ 10 ]

			);

			return this;

		}

		multiply( m ) {

			return this.multiplyMatrices( this, m );

		}

		premultiply( m ) {

			return this.multiplyMatrices( m, this );

		}

		multiplyMatrices( a, b ) {

			const ae = a.elements;
			const be = b.elements;
			const te = this.elements;

			const a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
			const a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
			const a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

			const b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
			const b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
			const b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

			te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
			te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
			te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

			te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
			te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
			te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

			te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
			te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
			te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

			return this;

		}

		multiplyScalar( s ) {

			const te = this.elements;

			te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
			te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
			te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

			return this;

		}

		determinant() {

			const te = this.elements;

			const a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
				d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
				g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

			return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

		}

		invert() {

			const te = this.elements,

				n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ],
				n12 = te[ 3 ], n22 = te[ 4 ], n32 = te[ 5 ],
				n13 = te[ 6 ], n23 = te[ 7 ], n33 = te[ 8 ],

				t11 = n33 * n22 - n32 * n23,
				t12 = n32 * n13 - n33 * n12,
				t13 = n23 * n12 - n22 * n13,

				det = n11 * t11 + n21 * t12 + n31 * t13;

			if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0 );

			const detInv = 1 / det;

			te[ 0 ] = t11 * detInv;
			te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
			te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

			te[ 3 ] = t12 * detInv;
			te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
			te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

			te[ 6 ] = t13 * detInv;
			te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
			te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

			return this;

		}

		transpose() {

			let tmp;
			const m = this.elements;

			tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
			tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
			tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

			return this;

		}

		getNormalMatrix( matrix4 ) {

			return this.setFromMatrix4( matrix4 ).invert().transpose();

		}

		transposeIntoArray( r ) {

			const m = this.elements;

			r[ 0 ] = m[ 0 ];
			r[ 1 ] = m[ 3 ];
			r[ 2 ] = m[ 6 ];
			r[ 3 ] = m[ 1 ];
			r[ 4 ] = m[ 4 ];
			r[ 5 ] = m[ 7 ];
			r[ 6 ] = m[ 2 ];
			r[ 7 ] = m[ 5 ];
			r[ 8 ] = m[ 8 ];

			return this;

		}

		setUvTransform( tx, ty, sx, sy, rotation, cx, cy ) {

			const c = Math.cos( rotation );
			const s = Math.sin( rotation );

			this.set(
				sx * c, sx * s, - sx * ( c * cx + s * cy ) + cx + tx,
				- sy * s, sy * c, - sy * ( - s * cx + c * cy ) + cy + ty,
				0, 0, 1
			);

			return this;

		}

		scale( sx, sy ) {

			const te = this.elements;

			te[ 0 ] *= sx; te[ 3 ] *= sx; te[ 6 ] *= sx;
			te[ 1 ] *= sy; te[ 4 ] *= sy; te[ 7 ] *= sy;

			return this;

		}

		rotate( theta ) {

			const c = Math.cos( theta );
			const s = Math.sin( theta );

			const te = this.elements;

			const a11 = te[ 0 ], a12 = te[ 3 ], a13 = te[ 6 ];
			const a21 = te[ 1 ], a22 = te[ 4 ], a23 = te[ 7 ];

			te[ 0 ] = c * a11 + s * a21;
			te[ 3 ] = c * a12 + s * a22;
			te[ 6 ] = c * a13 + s * a23;

			te[ 1 ] = - s * a11 + c * a21;
			te[ 4 ] = - s * a12 + c * a22;
			te[ 7 ] = - s * a13 + c * a23;

			return this;

		}

		translate( tx, ty ) {

			const te = this.elements;

			te[ 0 ] += tx * te[ 2 ]; te[ 3 ] += tx * te[ 5 ]; te[ 6 ] += tx * te[ 8 ];
			te[ 1 ] += ty * te[ 2 ]; te[ 4 ] += ty * te[ 5 ]; te[ 7 ] += ty * te[ 8 ];

			return this;

		}

		equals( matrix ) {

			const te = this.elements;
			const me = matrix.elements;

			for ( let i = 0; i < 9; i ++ ) {

				if ( te[ i ] !== me[ i ] ) return false;

			}

			return true;

		}

		fromArray( array, offset = 0 ) {

			for ( let i = 0; i < 9; i ++ ) {

				this.elements[ i ] = array[ i + offset ];

			}

			return this;

		}

		toArray( array = [], offset = 0 ) {

			const te = this.elements;

			array[ offset ] = te[ 0 ];
			array[ offset + 1 ] = te[ 1 ];
			array[ offset + 2 ] = te[ 2 ];

			array[ offset + 3 ] = te[ 3 ];
			array[ offset + 4 ] = te[ 4 ];
			array[ offset + 5 ] = te[ 5 ];

			array[ offset + 6 ] = te[ 6 ];
			array[ offset + 7 ] = te[ 7 ];
			array[ offset + 8 ] = te[ 8 ];

			return array;

		}

		clone() {

			return new this.constructor().fromArray( this.elements );

		}

	}

	Matrix3.prototype.isMatrix3 = true;

	let _object3DId = 0;

	const _v1$1 = /*@__PURE__*/ new Vector3();
	const _q1 = /*@__PURE__*/ new Quaternion();
	const _m1$1 = /*@__PURE__*/ new Matrix4();
	const _target = /*@__PURE__*/ new Vector3();

	const _position = /*@__PURE__*/ new Vector3();
	const _scale = /*@__PURE__*/ new Vector3();
	const _quaternion = /*@__PURE__*/ new Quaternion();

	const _xAxis = /*@__PURE__*/ new Vector3( 1, 0, 0 );
	const _yAxis = /*@__PURE__*/ new Vector3( 0, 1, 0 );
	const _zAxis = /*@__PURE__*/ new Vector3( 0, 0, 1 );

	const _addedEvent = { type: 'added' };
	const _removedEvent = { type: 'removed' };

	class Object3D extends EventDispatcher {

		constructor() {

			super();

			Object.defineProperty( this, 'id', { value: _object3DId ++ } );

			this.uuid = generateUUID();

			this.name = '';
			this.type = 'Object3D';

			this.parent = null;
			this.children = [];

			this.up = Object3D.DefaultUp.clone();

			const position = new Vector3();
			const rotation = new Euler();
			const quaternion = new Quaternion();
			const scale = new Vector3( 1, 1, 1 );

			function onRotationChange() {

				quaternion.setFromEuler( rotation, false );

			}

			function onQuaternionChange() {

				rotation.setFromQuaternion( quaternion, undefined, false );

			}

			rotation._onChange( onRotationChange );
			quaternion._onChange( onQuaternionChange );

			Object.defineProperties( this, {
				position: {
					configurable: true,
					enumerable: true,
					value: position
				},
				rotation: {
					configurable: true,
					enumerable: true,
					value: rotation
				},
				quaternion: {
					configurable: true,
					enumerable: true,
					value: quaternion
				},
				scale: {
					configurable: true,
					enumerable: true,
					value: scale
				},
				modelViewMatrix: {
					value: new Matrix4()
				},
				normalMatrix: {
					value: new Matrix3()
				}
			} );

			this.matrix = new Matrix4();
			this.matrixWorld = new Matrix4();

			this.matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate;
			this.matrixWorldNeedsUpdate = false;

			this.layers = new Layers();
			this.visible = true;

			this.castShadow = false;
			this.receiveShadow = false;

			this.frustumCulled = true;
			this.renderOrder = 0;

			this.animations = [];

			this.userData = {};

		}

		onBeforeRender( /* renderer, scene, camera, geometry, material, group */ ) {}

		onAfterRender( /* renderer, scene, camera, geometry, material, group */ ) {}

		applyMatrix4( matrix ) {

			if ( this.matrixAutoUpdate ) this.updateMatrix();

			this.matrix.premultiply( matrix );

			this.matrix.decompose( this.position, this.quaternion, this.scale );

		}

		applyQuaternion( q ) {

			this.quaternion.premultiply( q );

			return this;

		}

		setRotationFromAxisAngle( axis, angle ) {

			// assumes axis is normalized

			this.quaternion.setFromAxisAngle( axis, angle );

		}

		setRotationFromEuler( euler ) {

			this.quaternion.setFromEuler( euler, true );

		}

		setRotationFromMatrix( m ) {

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			this.quaternion.setFromRotationMatrix( m );

		}

		setRotationFromQuaternion( q ) {

			// assumes q is normalized

			this.quaternion.copy( q );

		}

		rotateOnAxis( axis, angle ) {

			// rotate object on axis in object space
			// axis is assumed to be normalized

			_q1.setFromAxisAngle( axis, angle );

			this.quaternion.multiply( _q1 );

			return this;

		}

		rotateOnWorldAxis( axis, angle ) {

			// rotate object on axis in world space
			// axis is assumed to be normalized
			// method assumes no rotated parent

			_q1.setFromAxisAngle( axis, angle );

			this.quaternion.premultiply( _q1 );

			return this;

		}

		rotateX( angle ) {

			return this.rotateOnAxis( _xAxis, angle );

		}

		rotateY( angle ) {

			return this.rotateOnAxis( _yAxis, angle );

		}

		rotateZ( angle ) {

			return this.rotateOnAxis( _zAxis, angle );

		}

		translateOnAxis( axis, distance ) {

			// translate object by distance along axis in object space
			// axis is assumed to be normalized

			_v1$1.copy( axis ).applyQuaternion( this.quaternion );

			this.position.add( _v1$1.multiplyScalar( distance ) );

			return this;

		}

		translateX( distance ) {

			return this.translateOnAxis( _xAxis, distance );

		}

		translateY( distance ) {

			return this.translateOnAxis( _yAxis, distance );

		}

		translateZ( distance ) {

			return this.translateOnAxis( _zAxis, distance );

		}

		localToWorld( vector ) {

			return vector.applyMatrix4( this.matrixWorld );

		}

		worldToLocal( vector ) {

			return vector.applyMatrix4( _m1$1.copy( this.matrixWorld ).invert() );

		}

		lookAt( x, y, z ) {

			// This method does not support objects having non-uniformly-scaled parent(s)

			if ( x.isVector3 ) {

				_target.copy( x );

			} else {

				_target.set( x, y, z );

			}

			const parent = this.parent;

			this.updateWorldMatrix( true, false );

			_position.setFromMatrixPosition( this.matrixWorld );

			if ( this.isCamera || this.isLight ) {

				_m1$1.lookAt( _position, _target, this.up );

			} else {

				_m1$1.lookAt( _target, _position, this.up );

			}

			this.quaternion.setFromRotationMatrix( _m1$1 );

			if ( parent ) {

				_m1$1.extractRotation( parent.matrixWorld );
				_q1.setFromRotationMatrix( _m1$1 );
				this.quaternion.premultiply( _q1.invert() );

			}

		}

		add( object ) {

			if ( arguments.length > 1 ) {

				for ( let i = 0; i < arguments.length; i ++ ) {

					this.add( arguments[ i ] );

				}

				return this;

			}

			if ( object === this ) {

				console.error( 'THREE.Object3D.add: object can\'t be added as a child of itself.', object );
				return this;

			}

			if ( object && object.isObject3D ) {

				if ( object.parent !== null ) {

					object.parent.remove( object );

				}

				object.parent = this;
				this.children.push( object );

				object.dispatchEvent( _addedEvent );

			} else {

				console.error( 'THREE.Object3D.add: object not an instance of THREE.Object3D.', object );

			}

			return this;

		}

		remove( object ) {

			if ( arguments.length > 1 ) {

				for ( let i = 0; i < arguments.length; i ++ ) {

					this.remove( arguments[ i ] );

				}

				return this;

			}

			const index = this.children.indexOf( object );

			if ( index !== - 1 ) {

				object.parent = null;
				this.children.splice( index, 1 );

				object.dispatchEvent( _removedEvent );

			}

			return this;

		}

		removeFromParent() {

			const parent = this.parent;

			if ( parent !== null ) {

				parent.remove( this );

			}

			return this;

		}

		clear() {

			for ( let i = 0; i < this.children.length; i ++ ) {

				const object = this.children[ i ];

				object.parent = null;

				object.dispatchEvent( _removedEvent );

			}

			this.children.length = 0;

			return this;


		}

		attach( object ) {

			// adds object as a child of this, while maintaining the object's world transform

			this.updateWorldMatrix( true, false );

			_m1$1.copy( this.matrixWorld ).invert();

			if ( object.parent !== null ) {

				object.parent.updateWorldMatrix( true, false );

				_m1$1.multiply( object.parent.matrixWorld );

			}

			object.applyMatrix4( _m1$1 );

			this.add( object );

			object.updateWorldMatrix( false, true );

			return this;

		}

		getObjectById( id ) {

			return this.getObjectByProperty( 'id', id );

		}

		getObjectByName( name ) {

			return this.getObjectByProperty( 'name', name );

		}

		getObjectByProperty( name, value ) {

			if ( this[ name ] === value ) return this;

			for ( let i = 0, l = this.children.length; i < l; i ++ ) {

				const child = this.children[ i ];
				const object = child.getObjectByProperty( name, value );

				if ( object !== undefined ) {

					return object;

				}

			}

			return undefined;

		}

		getWorldPosition( target ) {

			this.updateWorldMatrix( true, false );

			return target.setFromMatrixPosition( this.matrixWorld );

		}

		getWorldQuaternion( target ) {

			this.updateWorldMatrix( true, false );

			this.matrixWorld.decompose( _position, target, _scale );

			return target;

		}

		getWorldScale( target ) {

			this.updateWorldMatrix( true, false );

			this.matrixWorld.decompose( _position, _quaternion, target );

			return target;

		}

		getWorldDirection( target ) {

			this.updateWorldMatrix( true, false );

			const e = this.matrixWorld.elements;

			return target.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();

		}

		raycast() {}

		traverse( callback ) {

			callback( this );

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				children[ i ].traverse( callback );

			}

		}

		traverseVisible( callback ) {

			if ( this.visible === false ) return;

			callback( this );

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				children[ i ].traverseVisible( callback );

			}

		}

		traverseAncestors( callback ) {

			const parent = this.parent;

			if ( parent !== null ) {

				callback( parent );

				parent.traverseAncestors( callback );

			}

		}

		updateMatrix() {

			this.matrix.compose( this.position, this.quaternion, this.scale );

			this.matrixWorldNeedsUpdate = true;

		}

		updateMatrixWorld( force ) {

			if ( this.matrixAutoUpdate ) this.updateMatrix();

			if ( this.matrixWorldNeedsUpdate || force ) {

				if ( this.parent === null ) {

					this.matrixWorld.copy( this.matrix );

				} else {

					this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

				}

				this.matrixWorldNeedsUpdate = false;

				force = true;

			}

			// update children

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				children[ i ].updateMatrixWorld( force );

			}

		}

		updateWorldMatrix( updateParents, updateChildren ) {

			const parent = this.parent;

			if ( updateParents === true && parent !== null ) {

				parent.updateWorldMatrix( true, false );

			}

			if ( this.matrixAutoUpdate ) this.updateMatrix();

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			// update children

			if ( updateChildren === true ) {

				const children = this.children;

				for ( let i = 0, l = children.length; i < l; i ++ ) {

					children[ i ].updateWorldMatrix( false, true );

				}

			}

		}

		toJSON( meta ) {

			// meta is a string when called from JSON.stringify
			const isRootObject = ( meta === undefined || typeof meta === 'string' );

			const output = {};

			// meta is a hash used to collect geometries, materials.
			// not providing it implies that this is the root object
			// being serialized.
			if ( isRootObject ) {

				// initialize meta obj
				meta = {
					geometries: {},
					materials: {},
					textures: {},
					images: {},
					shapes: {},
					skeletons: {},
					animations: {}
				};

				output.metadata = {
					version: 4.5,
					type: 'Object',
					generator: 'Object3D.toJSON'
				};

			}

			// standard Object3D serialization

			const object = {};

			object.uuid = this.uuid;
			object.type = this.type;

			if ( this.name !== '' ) object.name = this.name;
			if ( this.castShadow === true ) object.castShadow = true;
			if ( this.receiveShadow === true ) object.receiveShadow = true;
			if ( this.visible === false ) object.visible = false;
			if ( this.frustumCulled === false ) object.frustumCulled = false;
			if ( this.renderOrder !== 0 ) object.renderOrder = this.renderOrder;
			if ( JSON.stringify( this.userData ) !== '{}' ) object.userData = this.userData;

			object.layers = this.layers.mask;
			object.matrix = this.matrix.toArray();

			if ( this.matrixAutoUpdate === false ) object.matrixAutoUpdate = false;

			// object specific properties

			if ( this.isInstancedMesh ) {

				object.type = 'InstancedMesh';
				object.count = this.count;
				object.instanceMatrix = this.instanceMatrix.toJSON();
				if ( this.instanceColor !== null ) object.instanceColor = this.instanceColor.toJSON();

			}

			//

			function serialize( library, element ) {

				if ( library[ element.uuid ] === undefined ) {

					library[ element.uuid ] = element.toJSON( meta );

				}

				return element.uuid;

			}

			if ( this.isScene ) {

				if ( this.background ) {

					if ( this.background.isColor ) {

						object.background = this.background.toJSON();

					} else if ( this.background.isTexture ) {

						object.background = this.background.toJSON( meta ).uuid;

					}

				}

				if ( this.environment && this.environment.isTexture ) {

					object.environment = this.environment.toJSON( meta ).uuid;

				}

			} else if ( this.isMesh || this.isLine || this.isPoints ) {

				object.geometry = serialize( meta.geometries, this.geometry );

				const parameters = this.geometry.parameters;

				if ( parameters !== undefined && parameters.shapes !== undefined ) {

					const shapes = parameters.shapes;

					if ( Array.isArray( shapes ) ) {

						for ( let i = 0, l = shapes.length; i < l; i ++ ) {

							const shape = shapes[ i ];

							serialize( meta.shapes, shape );

						}

					} else {

						serialize( meta.shapes, shapes );

					}

				}

			}

			if ( this.isSkinnedMesh ) {

				object.bindMode = this.bindMode;
				object.bindMatrix = this.bindMatrix.toArray();

				if ( this.skeleton !== undefined ) {

					serialize( meta.skeletons, this.skeleton );

					object.skeleton = this.skeleton.uuid;

				}

			}

			if ( this.material !== undefined ) {

				if ( Array.isArray( this.material ) ) {

					const uuids = [];

					for ( let i = 0, l = this.material.length; i < l; i ++ ) {

						uuids.push( serialize( meta.materials, this.material[ i ] ) );

					}

					object.material = uuids;

				} else {

					object.material = serialize( meta.materials, this.material );

				}

			}

			//

			if ( this.children.length > 0 ) {

				object.children = [];

				for ( let i = 0; i < this.children.length; i ++ ) {

					object.children.push( this.children[ i ].toJSON( meta ).object );

				}

			}

			//

			if ( this.animations.length > 0 ) {

				object.animations = [];

				for ( let i = 0; i < this.animations.length; i ++ ) {

					const animation = this.animations[ i ];

					object.animations.push( serialize( meta.animations, animation ) );

				}

			}

			if ( isRootObject ) {

				const geometries = extractFromCache( meta.geometries );
				const materials = extractFromCache( meta.materials );
				const textures = extractFromCache( meta.textures );
				const images = extractFromCache( meta.images );
				const shapes = extractFromCache( meta.shapes );
				const skeletons = extractFromCache( meta.skeletons );
				const animations = extractFromCache( meta.animations );

				if ( geometries.length > 0 ) output.geometries = geometries;
				if ( materials.length > 0 ) output.materials = materials;
				if ( textures.length > 0 ) output.textures = textures;
				if ( images.length > 0 ) output.images = images;
				if ( shapes.length > 0 ) output.shapes = shapes;
				if ( skeletons.length > 0 ) output.skeletons = skeletons;
				if ( animations.length > 0 ) output.animations = animations;

			}

			output.object = object;

			return output;

			// extract data from the cache hash
			// remove metadata on each item
			// and return as array
			function extractFromCache( cache ) {

				const values = [];
				for ( const key in cache ) {

					const data = cache[ key ];
					delete data.metadata;
					values.push( data );

				}

				return values;

			}

		}

		clone( recursive ) {

			return new this.constructor().copy( this, recursive );

		}

		copy( source, recursive = true ) {

			this.name = source.name;

			this.up.copy( source.up );

			this.position.copy( source.position );
			this.rotation.order = source.rotation.order;
			this.quaternion.copy( source.quaternion );
			this.scale.copy( source.scale );

			this.matrix.copy( source.matrix );
			this.matrixWorld.copy( source.matrixWorld );

			this.matrixAutoUpdate = source.matrixAutoUpdate;
			this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

			this.layers.mask = source.layers.mask;
			this.visible = source.visible;

			this.castShadow = source.castShadow;
			this.receiveShadow = source.receiveShadow;

			this.frustumCulled = source.frustumCulled;
			this.renderOrder = source.renderOrder;

			this.userData = JSON.parse( JSON.stringify( source.userData ) );

			if ( recursive === true ) {

				for ( let i = 0; i < source.children.length; i ++ ) {

					const child = source.children[ i ];
					this.add( child.clone() );

				}

			}

			return this;

		}

	}

	Object3D.DefaultUp = new Vector3( 0, 1, 0 );
	Object3D.DefaultMatrixAutoUpdate = true;

	Object3D.prototype.isObject3D = true;

	const _v0 = /*@__PURE__*/ new Vector3();
	const _v1 = /*@__PURE__*/ new Vector3();
	const _v2 = /*@__PURE__*/ new Vector3();
	const _v3 = /*@__PURE__*/ new Vector3();

	const _vab = /*@__PURE__*/ new Vector3();
	const _vac = /*@__PURE__*/ new Vector3();
	const _vbc = /*@__PURE__*/ new Vector3();
	const _vap = /*@__PURE__*/ new Vector3();
	const _vbp = /*@__PURE__*/ new Vector3();
	const _vcp = /*@__PURE__*/ new Vector3();

	class Triangle {

		constructor( a = new Vector3(), b = new Vector3(), c = new Vector3() ) {

			this.a = a;
			this.b = b;
			this.c = c;

		}

		static getNormal( a, b, c, target ) {

			target.subVectors( c, b );
			_v0.subVectors( a, b );
			target.cross( _v0 );

			const targetLengthSq = target.lengthSq();
			if ( targetLengthSq > 0 ) {

				return target.multiplyScalar( 1 / Math.sqrt( targetLengthSq ) );

			}

			return target.set( 0, 0, 0 );

		}

		// static/instance method to calculate barycentric coordinates
		// based on: http://www.blackpawn.com/texts/pointinpoly/default.html
		static getBarycoord( point, a, b, c, target ) {

			_v0.subVectors( c, a );
			_v1.subVectors( b, a );
			_v2.subVectors( point, a );

			const dot00 = _v0.dot( _v0 );
			const dot01 = _v0.dot( _v1 );
			const dot02 = _v0.dot( _v2 );
			const dot11 = _v1.dot( _v1 );
			const dot12 = _v1.dot( _v2 );

			const denom = ( dot00 * dot11 - dot01 * dot01 );

			// collinear or singular triangle
			if ( denom === 0 ) {

				// arbitrary location outside of triangle?
				// not sure if this is the best idea, maybe should be returning undefined
				return target.set( - 2, - 1, - 1 );

			}

			const invDenom = 1 / denom;
			const u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
			const v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

			// barycentric coordinates must always sum to 1
			return target.set( 1 - u - v, v, u );

		}

		static containsPoint( point, a, b, c ) {

			this.getBarycoord( point, a, b, c, _v3 );

			return ( _v3.x >= 0 ) && ( _v3.y >= 0 ) && ( ( _v3.x + _v3.y ) <= 1 );

		}

		static getUV( point, p1, p2, p3, uv1, uv2, uv3, target ) {

			this.getBarycoord( point, p1, p2, p3, _v3 );

			target.set( 0, 0 );
			target.addScaledVector( uv1, _v3.x );
			target.addScaledVector( uv2, _v3.y );
			target.addScaledVector( uv3, _v3.z );

			return target;

		}

		static isFrontFacing( a, b, c, direction ) {

			_v0.subVectors( c, b );
			_v1.subVectors( a, b );

			// strictly front facing
			return ( _v0.cross( _v1 ).dot( direction ) < 0 ) ? true : false;

		}

		set( a, b, c ) {

			this.a.copy( a );
			this.b.copy( b );
			this.c.copy( c );

			return this;

		}

		setFromPointsAndIndices( points, i0, i1, i2 ) {

			this.a.copy( points[ i0 ] );
			this.b.copy( points[ i1 ] );
			this.c.copy( points[ i2 ] );

			return this;

		}

		setFromAttributeAndIndices( attribute, i0, i1, i2 ) {

			this.a.fromBufferAttribute( attribute, i0 );
			this.b.fromBufferAttribute( attribute, i1 );
			this.c.fromBufferAttribute( attribute, i2 );

			return this;

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( triangle ) {

			this.a.copy( triangle.a );
			this.b.copy( triangle.b );
			this.c.copy( triangle.c );

			return this;

		}

		getArea() {

			_v0.subVectors( this.c, this.b );
			_v1.subVectors( this.a, this.b );

			return _v0.cross( _v1 ).length() * 0.5;

		}

		getMidpoint( target ) {

			return target.addVectors( this.a, this.b ).add( this.c ).multiplyScalar( 1 / 3 );

		}

		getNormal( target ) {

			return Triangle.getNormal( this.a, this.b, this.c, target );

		}

		getPlane( target ) {

			return target.setFromCoplanarPoints( this.a, this.b, this.c );

		}

		getBarycoord( point, target ) {

			return Triangle.getBarycoord( point, this.a, this.b, this.c, target );

		}

		getUV( point, uv1, uv2, uv3, target ) {

			return Triangle.getUV( point, this.a, this.b, this.c, uv1, uv2, uv3, target );

		}

		containsPoint( point ) {

			return Triangle.containsPoint( point, this.a, this.b, this.c );

		}

		isFrontFacing( direction ) {

			return Triangle.isFrontFacing( this.a, this.b, this.c, direction );

		}

		intersectsBox( box ) {

			return box.intersectsTriangle( this );

		}

		closestPointToPoint( p, target ) {

			const a = this.a, b = this.b, c = this.c;
			let v, w;

			// algorithm thanks to Real-Time Collision Detection by Christer Ericson,
			// published by Morgan Kaufmann Publishers, (c) 2005 Elsevier Inc.,
			// under the accompanying license; see chapter 5.1.5 for detailed explanation.
			// basically, we're distinguishing which of the voronoi regions of the triangle
			// the point lies in with the minimum amount of redundant computation.

			_vab.subVectors( b, a );
			_vac.subVectors( c, a );
			_vap.subVectors( p, a );
			const d1 = _vab.dot( _vap );
			const d2 = _vac.dot( _vap );
			if ( d1 <= 0 && d2 <= 0 ) {

				// vertex region of A; barycentric coords (1, 0, 0)
				return target.copy( a );

			}

			_vbp.subVectors( p, b );
			const d3 = _vab.dot( _vbp );
			const d4 = _vac.dot( _vbp );
			if ( d3 >= 0 && d4 <= d3 ) {

				// vertex region of B; barycentric coords (0, 1, 0)
				return target.copy( b );

			}

			const vc = d1 * d4 - d3 * d2;
			if ( vc <= 0 && d1 >= 0 && d3 <= 0 ) {

				v = d1 / ( d1 - d3 );
				// edge region of AB; barycentric coords (1-v, v, 0)
				return target.copy( a ).addScaledVector( _vab, v );

			}

			_vcp.subVectors( p, c );
			const d5 = _vab.dot( _vcp );
			const d6 = _vac.dot( _vcp );
			if ( d6 >= 0 && d5 <= d6 ) {

				// vertex region of C; barycentric coords (0, 0, 1)
				return target.copy( c );

			}

			const vb = d5 * d2 - d1 * d6;
			if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {

				w = d2 / ( d2 - d6 );
				// edge region of AC; barycentric coords (1-w, 0, w)
				return target.copy( a ).addScaledVector( _vac, w );

			}

			const va = d3 * d6 - d5 * d4;
			if ( va <= 0 && ( d4 - d3 ) >= 0 && ( d5 - d6 ) >= 0 ) {

				_vbc.subVectors( c, b );
				w = ( d4 - d3 ) / ( ( d4 - d3 ) + ( d5 - d6 ) );
				// edge region of BC; barycentric coords (0, 1-w, w)
				return target.copy( b ).addScaledVector( _vbc, w ); // edge region of BC

			}

			// face region
			const denom = 1 / ( va + vb + vc );
			// u = va * denom
			v = vb * denom;
			w = vc * denom;

			return target.copy( a ).addScaledVector( _vab, v ).addScaledVector( _vac, w );

		}

		equals( triangle ) {

			return triangle.a.equals( this.a ) && triangle.b.equals( this.b ) && triangle.c.equals( this.c );

		}

	}

	const FrontSide = 0;
	const BackSide = 1;
	const DoubleSide = 2;
	const FlatShading = 1;
	const NormalBlending = 1;
	const AddEquation = 100;
	const SrcAlphaFactor = 204;
	const OneMinusSrcAlphaFactor = 205;
	const LessEqualDepth = 3;
	const MultiplyOperation = 0;

	const UVMapping = 300;
	const RepeatWrapping = 1000;
	const ClampToEdgeWrapping = 1001;
	const MirroredRepeatWrapping = 1002;
	const NearestFilter = 1003;
	const NearestMipmapNearestFilter = 1004;
	const NearestMipmapLinearFilter = 1005;
	const LinearFilter = 1006;
	const LinearMipmapNearestFilter = 1007;
	const LinearMipmapLinearFilter = 1008;
	const UnsignedByteType = 1009;
	const RGBAFormat = 1023;
	const InterpolateDiscrete = 2300;
	const InterpolateLinear = 2301;
	const LinearEncoding = 3000;
	const TangentSpaceNormalMap = 0;
	const KeepStencilOp = 7680;
	const AlwaysStencilFunc = 519;

	const StaticDrawUsage = 35044;

	let materialId = 0;

	class Material extends EventDispatcher {

		constructor() {

			super();

			Object.defineProperty( this, 'id', { value: materialId ++ } );

			this.uuid = generateUUID();

			this.name = '';
			this.type = 'Material';

			this.fog = true;

			this.blending = NormalBlending;
			this.side = FrontSide;
			this.vertexColors = false;

			this.opacity = 1;
			this.format = RGBAFormat;
			this.transparent = false;

			this.blendSrc = SrcAlphaFactor;
			this.blendDst = OneMinusSrcAlphaFactor;
			this.blendEquation = AddEquation;
			this.blendSrcAlpha = null;
			this.blendDstAlpha = null;
			this.blendEquationAlpha = null;

			this.depthFunc = LessEqualDepth;
			this.depthTest = true;
			this.depthWrite = true;

			this.stencilWriteMask = 0xff;
			this.stencilFunc = AlwaysStencilFunc;
			this.stencilRef = 0;
			this.stencilFuncMask = 0xff;
			this.stencilFail = KeepStencilOp;
			this.stencilZFail = KeepStencilOp;
			this.stencilZPass = KeepStencilOp;
			this.stencilWrite = false;

			this.clippingPlanes = null;
			this.clipIntersection = false;
			this.clipShadows = false;

			this.shadowSide = null;

			this.colorWrite = true;

			this.precision = null; // override the renderer's default precision for this material

			this.polygonOffset = false;
			this.polygonOffsetFactor = 0;
			this.polygonOffsetUnits = 0;

			this.dithering = false;

			this.alphaToCoverage = false;
			this.premultipliedAlpha = false;

			this.visible = true;

			this.toneMapped = true;

			this.userData = {};

			this.version = 0;

			this._alphaTest = 0;

		}

		get alphaTest() {

			return this._alphaTest;

		}

		set alphaTest( value ) {

			if ( this._alphaTest > 0 !== value > 0 ) {

				this.version ++;

			}

			this._alphaTest = value;

		}

		onBuild( /* shaderobject, renderer */ ) {}

		onBeforeRender( /* renderer, scene, camera, geometry, object, group */ ) {}

		onBeforeCompile( /* shaderobject, renderer */ ) {}

		customProgramCacheKey() {

			return this.onBeforeCompile.toString();

		}

		setValues( values ) {

			if ( values === undefined ) return;

			for ( const key in values ) {

				const newValue = values[ key ];

				if ( newValue === undefined ) {

					console.warn( 'THREE.Material: \'' + key + '\' parameter is undefined.' );
					continue;

				}

				// for backward compatability if shading is set in the constructor
				if ( key === 'shading' ) {

					console.warn( 'THREE.' + this.type + ': .shading has been removed. Use the boolean .flatShading instead.' );
					this.flatShading = ( newValue === FlatShading ) ? true : false;
					continue;

				}

				const currentValue = this[ key ];

				if ( currentValue === undefined ) {

					console.warn( 'THREE.' + this.type + ': \'' + key + '\' is not a property of this material.' );
					continue;

				}

				if ( currentValue && currentValue.isColor ) {

					currentValue.set( newValue );

				} else if ( ( currentValue && currentValue.isVector3 ) && ( newValue && newValue.isVector3 ) ) {

					currentValue.copy( newValue );

				} else {

					this[ key ] = newValue;

				}

			}

		}

		toJSON( meta ) {

			const isRoot = ( meta === undefined || typeof meta === 'string' );

			if ( isRoot ) {

				meta = {
					textures: {},
					images: {}
				};

			}

			const data = {
				metadata: {
					version: 4.5,
					type: 'Material',
					generator: 'Material.toJSON'
				}
			};

			// standard Material serialization
			data.uuid = this.uuid;
			data.type = this.type;

			if ( this.name !== '' ) data.name = this.name;

			if ( this.color && this.color.isColor ) data.color = this.color.getHex();

			if ( this.roughness !== undefined ) data.roughness = this.roughness;
			if ( this.metalness !== undefined ) data.metalness = this.metalness;

			if ( this.sheen !== undefined ) data.sheen = this.sheen;
			if ( this.sheenColor && this.sheenColor.isColor ) data.sheenColor = this.sheenColor.getHex();
			if ( this.sheenRoughness !== undefined ) data.sheenRoughness = this.sheenRoughness;
			if ( this.emissive && this.emissive.isColor ) data.emissive = this.emissive.getHex();
			if ( this.emissiveIntensity && this.emissiveIntensity !== 1 ) data.emissiveIntensity = this.emissiveIntensity;

			if ( this.specular && this.specular.isColor ) data.specular = this.specular.getHex();
			if ( this.specularIntensity !== undefined ) data.specularIntensity = this.specularIntensity;
			if ( this.specularColor && this.specularColor.isColor ) data.specularColor = this.specularColor.getHex();
			if ( this.shininess !== undefined ) data.shininess = this.shininess;
			if ( this.clearcoat !== undefined ) data.clearcoat = this.clearcoat;
			if ( this.clearcoatRoughness !== undefined ) data.clearcoatRoughness = this.clearcoatRoughness;

			if ( this.clearcoatMap && this.clearcoatMap.isTexture ) {

				data.clearcoatMap = this.clearcoatMap.toJSON( meta ).uuid;

			}

			if ( this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture ) {

				data.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON( meta ).uuid;

			}

			if ( this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture ) {

				data.clearcoatNormalMap = this.clearcoatNormalMap.toJSON( meta ).uuid;
				data.clearcoatNormalScale = this.clearcoatNormalScale.toArray();

			}

			if ( this.map && this.map.isTexture ) data.map = this.map.toJSON( meta ).uuid;
			if ( this.matcap && this.matcap.isTexture ) data.matcap = this.matcap.toJSON( meta ).uuid;
			if ( this.alphaMap && this.alphaMap.isTexture ) data.alphaMap = this.alphaMap.toJSON( meta ).uuid;

			if ( this.lightMap && this.lightMap.isTexture ) {

				data.lightMap = this.lightMap.toJSON( meta ).uuid;
				data.lightMapIntensity = this.lightMapIntensity;

			}

			if ( this.aoMap && this.aoMap.isTexture ) {

				data.aoMap = this.aoMap.toJSON( meta ).uuid;
				data.aoMapIntensity = this.aoMapIntensity;

			}

			if ( this.bumpMap && this.bumpMap.isTexture ) {

				data.bumpMap = this.bumpMap.toJSON( meta ).uuid;
				data.bumpScale = this.bumpScale;

			}

			if ( this.normalMap && this.normalMap.isTexture ) {

				data.normalMap = this.normalMap.toJSON( meta ).uuid;
				data.normalMapType = this.normalMapType;
				data.normalScale = this.normalScale.toArray();

			}

			if ( this.displacementMap && this.displacementMap.isTexture ) {

				data.displacementMap = this.displacementMap.toJSON( meta ).uuid;
				data.displacementScale = this.displacementScale;
				data.displacementBias = this.displacementBias;

			}

			if ( this.roughnessMap && this.roughnessMap.isTexture ) data.roughnessMap = this.roughnessMap.toJSON( meta ).uuid;
			if ( this.metalnessMap && this.metalnessMap.isTexture ) data.metalnessMap = this.metalnessMap.toJSON( meta ).uuid;

			if ( this.emissiveMap && this.emissiveMap.isTexture ) data.emissiveMap = this.emissiveMap.toJSON( meta ).uuid;
			if ( this.specularMap && this.specularMap.isTexture ) data.specularMap = this.specularMap.toJSON( meta ).uuid;
			if ( this.specularIntensityMap && this.specularIntensityMap.isTexture ) data.specularIntensityMap = this.specularIntensityMap.toJSON( meta ).uuid;
			if ( this.specularColorMap && this.specularColorMap.isTexture ) data.specularColorMap = this.specularColorMap.toJSON( meta ).uuid;

			if ( this.envMap && this.envMap.isTexture ) {

				data.envMap = this.envMap.toJSON( meta ).uuid;

				if ( this.combine !== undefined ) data.combine = this.combine;

			}

			if ( this.envMapIntensity !== undefined ) data.envMapIntensity = this.envMapIntensity;
			if ( this.reflectivity !== undefined ) data.reflectivity = this.reflectivity;
			if ( this.refractionRatio !== undefined ) data.refractionRatio = this.refractionRatio;

			if ( this.gradientMap && this.gradientMap.isTexture ) {

				data.gradientMap = this.gradientMap.toJSON( meta ).uuid;

			}

			if ( this.transmission !== undefined ) data.transmission = this.transmission;
			if ( this.transmissionMap && this.transmissionMap.isTexture ) data.transmissionMap = this.transmissionMap.toJSON( meta ).uuid;
			if ( this.thickness !== undefined ) data.thickness = this.thickness;
			if ( this.thicknessMap && this.thicknessMap.isTexture ) data.thicknessMap = this.thicknessMap.toJSON( meta ).uuid;
			if ( this.attenuationDistance !== undefined ) data.attenuationDistance = this.attenuationDistance;
			if ( this.attenuationColor !== undefined ) data.attenuationColor = this.attenuationColor.getHex();

			if ( this.size !== undefined ) data.size = this.size;
			if ( this.shadowSide !== null ) data.shadowSide = this.shadowSide;
			if ( this.sizeAttenuation !== undefined ) data.sizeAttenuation = this.sizeAttenuation;

			if ( this.blending !== NormalBlending ) data.blending = this.blending;
			if ( this.side !== FrontSide ) data.side = this.side;
			if ( this.vertexColors ) data.vertexColors = true;

			if ( this.opacity < 1 ) data.opacity = this.opacity;
			if ( this.format !== RGBAFormat ) data.format = this.format;
			if ( this.transparent === true ) data.transparent = this.transparent;

			data.depthFunc = this.depthFunc;
			data.depthTest = this.depthTest;
			data.depthWrite = this.depthWrite;
			data.colorWrite = this.colorWrite;

			data.stencilWrite = this.stencilWrite;
			data.stencilWriteMask = this.stencilWriteMask;
			data.stencilFunc = this.stencilFunc;
			data.stencilRef = this.stencilRef;
			data.stencilFuncMask = this.stencilFuncMask;
			data.stencilFail = this.stencilFail;
			data.stencilZFail = this.stencilZFail;
			data.stencilZPass = this.stencilZPass;

			// rotation (SpriteMaterial)
			if ( this.rotation && this.rotation !== 0 ) data.rotation = this.rotation;

			if ( this.polygonOffset === true ) data.polygonOffset = true;
			if ( this.polygonOffsetFactor !== 0 ) data.polygonOffsetFactor = this.polygonOffsetFactor;
			if ( this.polygonOffsetUnits !== 0 ) data.polygonOffsetUnits = this.polygonOffsetUnits;

			if ( this.linewidth && this.linewidth !== 1 ) data.linewidth = this.linewidth;
			if ( this.dashSize !== undefined ) data.dashSize = this.dashSize;
			if ( this.gapSize !== undefined ) data.gapSize = this.gapSize;
			if ( this.scale !== undefined ) data.scale = this.scale;

			if ( this.dithering === true ) data.dithering = true;

			if ( this.alphaTest > 0 ) data.alphaTest = this.alphaTest;
			if ( this.alphaToCoverage === true ) data.alphaToCoverage = this.alphaToCoverage;
			if ( this.premultipliedAlpha === true ) data.premultipliedAlpha = this.premultipliedAlpha;

			if ( this.wireframe === true ) data.wireframe = this.wireframe;
			if ( this.wireframeLinewidth > 1 ) data.wireframeLinewidth = this.wireframeLinewidth;
			if ( this.wireframeLinecap !== 'round' ) data.wireframeLinecap = this.wireframeLinecap;
			if ( this.wireframeLinejoin !== 'round' ) data.wireframeLinejoin = this.wireframeLinejoin;

			if ( this.flatShading === true ) data.flatShading = this.flatShading;

			if ( this.visible === false ) data.visible = false;

			if ( this.toneMapped === false ) data.toneMapped = false;

			if ( JSON.stringify( this.userData ) !== '{}' ) data.userData = this.userData;

			// TODO: Copied from Object3D.toJSON

			function extractFromCache( cache ) {

				const values = [];

				for ( const key in cache ) {

					const data = cache[ key ];
					delete data.metadata;
					values.push( data );

				}

				return values;

			}

			if ( isRoot ) {

				const textures = extractFromCache( meta.textures );
				const images = extractFromCache( meta.images );

				if ( textures.length > 0 ) data.textures = textures;
				if ( images.length > 0 ) data.images = images;

			}

			return data;

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( source ) {

			this.name = source.name;

			this.fog = source.fog;

			this.blending = source.blending;
			this.side = source.side;
			this.vertexColors = source.vertexColors;

			this.opacity = source.opacity;
			this.format = source.format;
			this.transparent = source.transparent;

			this.blendSrc = source.blendSrc;
			this.blendDst = source.blendDst;
			this.blendEquation = source.blendEquation;
			this.blendSrcAlpha = source.blendSrcAlpha;
			this.blendDstAlpha = source.blendDstAlpha;
			this.blendEquationAlpha = source.blendEquationAlpha;

			this.depthFunc = source.depthFunc;
			this.depthTest = source.depthTest;
			this.depthWrite = source.depthWrite;

			this.stencilWriteMask = source.stencilWriteMask;
			this.stencilFunc = source.stencilFunc;
			this.stencilRef = source.stencilRef;
			this.stencilFuncMask = source.stencilFuncMask;
			this.stencilFail = source.stencilFail;
			this.stencilZFail = source.stencilZFail;
			this.stencilZPass = source.stencilZPass;
			this.stencilWrite = source.stencilWrite;

			const srcPlanes = source.clippingPlanes;
			let dstPlanes = null;

			if ( srcPlanes !== null ) {

				const n = srcPlanes.length;
				dstPlanes = new Array( n );

				for ( let i = 0; i !== n; ++ i ) {

					dstPlanes[ i ] = srcPlanes[ i ].clone();

				}

			}

			this.clippingPlanes = dstPlanes;
			this.clipIntersection = source.clipIntersection;
			this.clipShadows = source.clipShadows;

			this.shadowSide = source.shadowSide;

			this.colorWrite = source.colorWrite;

			this.precision = source.precision;

			this.polygonOffset = source.polygonOffset;
			this.polygonOffsetFactor = source.polygonOffsetFactor;
			this.polygonOffsetUnits = source.polygonOffsetUnits;

			this.dithering = source.dithering;

			this.alphaTest = source.alphaTest;
			this.alphaToCoverage = source.alphaToCoverage;
			this.premultipliedAlpha = source.premultipliedAlpha;

			this.visible = source.visible;

			this.toneMapped = source.toneMapped;

			this.userData = JSON.parse( JSON.stringify( source.userData ) );

			return this;

		}

		dispose() {

			this.dispatchEvent( { type: 'dispose' } );

		}

		set needsUpdate( value ) {

			if ( value === true ) this.version ++;

		}

	}

	Material.prototype.isMaterial = true;

	const _colorKeywords = { 'aliceblue': 0xF0F8FF, 'antiquewhite': 0xFAEBD7, 'aqua': 0x00FFFF, 'aquamarine': 0x7FFFD4, 'azure': 0xF0FFFF,
		'beige': 0xF5F5DC, 'bisque': 0xFFE4C4, 'black': 0x000000, 'blanchedalmond': 0xFFEBCD, 'blue': 0x0000FF, 'blueviolet': 0x8A2BE2,
		'brown': 0xA52A2A, 'burlywood': 0xDEB887, 'cadetblue': 0x5F9EA0, 'chartreuse': 0x7FFF00, 'chocolate': 0xD2691E, 'coral': 0xFF7F50,
		'cornflowerblue': 0x6495ED, 'cornsilk': 0xFFF8DC, 'crimson': 0xDC143C, 'cyan': 0x00FFFF, 'darkblue': 0x00008B, 'darkcyan': 0x008B8B,
		'darkgoldenrod': 0xB8860B, 'darkgray': 0xA9A9A9, 'darkgreen': 0x006400, 'darkgrey': 0xA9A9A9, 'darkkhaki': 0xBDB76B, 'darkmagenta': 0x8B008B,
		'darkolivegreen': 0x556B2F, 'darkorange': 0xFF8C00, 'darkorchid': 0x9932CC, 'darkred': 0x8B0000, 'darksalmon': 0xE9967A, 'darkseagreen': 0x8FBC8F,
		'darkslateblue': 0x483D8B, 'darkslategray': 0x2F4F4F, 'darkslategrey': 0x2F4F4F, 'darkturquoise': 0x00CED1, 'darkviolet': 0x9400D3,
		'deeppink': 0xFF1493, 'deepskyblue': 0x00BFFF, 'dimgray': 0x696969, 'dimgrey': 0x696969, 'dodgerblue': 0x1E90FF, 'firebrick': 0xB22222,
		'floralwhite': 0xFFFAF0, 'forestgreen': 0x228B22, 'fuchsia': 0xFF00FF, 'gainsboro': 0xDCDCDC, 'ghostwhite': 0xF8F8FF, 'gold': 0xFFD700,
		'goldenrod': 0xDAA520, 'gray': 0x808080, 'green': 0x008000, 'greenyellow': 0xADFF2F, 'grey': 0x808080, 'honeydew': 0xF0FFF0, 'hotpink': 0xFF69B4,
		'indianred': 0xCD5C5C, 'indigo': 0x4B0082, 'ivory': 0xFFFFF0, 'khaki': 0xF0E68C, 'lavender': 0xE6E6FA, 'lavenderblush': 0xFFF0F5, 'lawngreen': 0x7CFC00,
		'lemonchiffon': 0xFFFACD, 'lightblue': 0xADD8E6, 'lightcoral': 0xF08080, 'lightcyan': 0xE0FFFF, 'lightgoldenrodyellow': 0xFAFAD2, 'lightgray': 0xD3D3D3,
		'lightgreen': 0x90EE90, 'lightgrey': 0xD3D3D3, 'lightpink': 0xFFB6C1, 'lightsalmon': 0xFFA07A, 'lightseagreen': 0x20B2AA, 'lightskyblue': 0x87CEFA,
		'lightslategray': 0x778899, 'lightslategrey': 0x778899, 'lightsteelblue': 0xB0C4DE, 'lightyellow': 0xFFFFE0, 'lime': 0x00FF00, 'limegreen': 0x32CD32,
		'linen': 0xFAF0E6, 'magenta': 0xFF00FF, 'maroon': 0x800000, 'mediumaquamarine': 0x66CDAA, 'mediumblue': 0x0000CD, 'mediumorchid': 0xBA55D3,
		'mediumpurple': 0x9370DB, 'mediumseagreen': 0x3CB371, 'mediumslateblue': 0x7B68EE, 'mediumspringgreen': 0x00FA9A, 'mediumturquoise': 0x48D1CC,
		'mediumvioletred': 0xC71585, 'midnightblue': 0x191970, 'mintcream': 0xF5FFFA, 'mistyrose': 0xFFE4E1, 'moccasin': 0xFFE4B5, 'navajowhite': 0xFFDEAD,
		'navy': 0x000080, 'oldlace': 0xFDF5E6, 'olive': 0x808000, 'olivedrab': 0x6B8E23, 'orange': 0xFFA500, 'orangered': 0xFF4500, 'orchid': 0xDA70D6,
		'palegoldenrod': 0xEEE8AA, 'palegreen': 0x98FB98, 'paleturquoise': 0xAFEEEE, 'palevioletred': 0xDB7093, 'papayawhip': 0xFFEFD5, 'peachpuff': 0xFFDAB9,
		'peru': 0xCD853F, 'pink': 0xFFC0CB, 'plum': 0xDDA0DD, 'powderblue': 0xB0E0E6, 'purple': 0x800080, 'rebeccapurple': 0x663399, 'red': 0xFF0000, 'rosybrown': 0xBC8F8F,
		'royalblue': 0x4169E1, 'saddlebrown': 0x8B4513, 'salmon': 0xFA8072, 'sandybrown': 0xF4A460, 'seagreen': 0x2E8B57, 'seashell': 0xFFF5EE,
		'sienna': 0xA0522D, 'silver': 0xC0C0C0, 'skyblue': 0x87CEEB, 'slateblue': 0x6A5ACD, 'slategray': 0x708090, 'slategrey': 0x708090, 'snow': 0xFFFAFA,
		'springgreen': 0x00FF7F, 'steelblue': 0x4682B4, 'tan': 0xD2B48C, 'teal': 0x008080, 'thistle': 0xD8BFD8, 'tomato': 0xFF6347, 'turquoise': 0x40E0D0,
		'violet': 0xEE82EE, 'wheat': 0xF5DEB3, 'white': 0xFFFFFF, 'whitesmoke': 0xF5F5F5, 'yellow': 0xFFFF00, 'yellowgreen': 0x9ACD32 };

	const _hslA = { h: 0, s: 0, l: 0 };
	const _hslB = { h: 0, s: 0, l: 0 };

	function hue2rgb( p, q, t ) {

		if ( t < 0 ) t += 1;
		if ( t > 1 ) t -= 1;
		if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
		if ( t < 1 / 2 ) return q;
		if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
		return p;

	}

	function SRGBToLinear( c ) {

		return ( c < 0.04045 ) ? c * 0.0773993808 : Math.pow( c * 0.9478672986 + 0.0521327014, 2.4 );

	}

	function LinearToSRGB( c ) {

		return ( c < 0.0031308 ) ? c * 12.92 : 1.055 * ( Math.pow( c, 0.41666 ) ) - 0.055;

	}

	class Color {

		constructor( r, g, b ) {

			if ( g === undefined && b === undefined ) {

				// r is THREE.Color, hex or string
				return this.set( r );

			}

			return this.setRGB( r, g, b );

		}

		set( value ) {

			if ( value && value.isColor ) {

				this.copy( value );

			} else if ( typeof value === 'number' ) {

				this.setHex( value );

			} else if ( typeof value === 'string' ) {

				this.setStyle( value );

			}

			return this;

		}

		setScalar( scalar ) {

			this.r = scalar;
			this.g = scalar;
			this.b = scalar;

			return this;

		}

		setHex( hex ) {

			hex = Math.floor( hex );

			this.r = ( hex >> 16 & 255 ) / 255;
			this.g = ( hex >> 8 & 255 ) / 255;
			this.b = ( hex & 255 ) / 255;

			return this;

		}

		setRGB( r, g, b ) {

			this.r = r;
			this.g = g;
			this.b = b;

			return this;

		}

		setHSL( h, s, l ) {

			// h,s,l ranges are in 0.0 - 1.0
			h = euclideanModulo( h, 1 );
			s = clamp( s, 0, 1 );
			l = clamp( l, 0, 1 );

			if ( s === 0 ) {

				this.r = this.g = this.b = l;

			} else {

				const p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
				const q = ( 2 * l ) - p;

				this.r = hue2rgb( q, p, h + 1 / 3 );
				this.g = hue2rgb( q, p, h );
				this.b = hue2rgb( q, p, h - 1 / 3 );

			}

			return this;

		}

		setStyle( style ) {

			function handleAlpha( string ) {

				if ( string === undefined ) return;

				if ( parseFloat( string ) < 1 ) {

					console.warn( 'THREE.Color: Alpha component of ' + style + ' will be ignored.' );

				}

			}


			let m;

			if ( m = /^((?:rgb|hsl)a?)\(([^\)]*)\)/.exec( style ) ) {

				// rgb / hsl

				let color;
				const name = m[ 1 ];
				const components = m[ 2 ];

				switch ( name ) {

					case 'rgb':
					case 'rgba':

						if ( color = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

							// rgb(255,0,0) rgba(255,0,0,0.5)
							this.r = Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255;
							this.g = Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255;
							this.b = Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255;

							handleAlpha( color[ 4 ] );

							return this;

						}

						if ( color = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

							// rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)
							this.r = Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100;
							this.g = Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100;
							this.b = Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100;

							handleAlpha( color[ 4 ] );

							return this;

						}

						break;

					case 'hsl':
					case 'hsla':

						if ( color = /^\s*(\d*\.?\d+)\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

							// hsl(120,50%,50%) hsla(120,50%,50%,0.5)
							const h = parseFloat( color[ 1 ] ) / 360;
							const s = parseInt( color[ 2 ], 10 ) / 100;
							const l = parseInt( color[ 3 ], 10 ) / 100;

							handleAlpha( color[ 4 ] );

							return this.setHSL( h, s, l );

						}

						break;

				}

			} else if ( m = /^\#([A-Fa-f\d]+)$/.exec( style ) ) {

				// hex color

				const hex = m[ 1 ];
				const size = hex.length;

				if ( size === 3 ) {

					// #ff0
					this.r = parseInt( hex.charAt( 0 ) + hex.charAt( 0 ), 16 ) / 255;
					this.g = parseInt( hex.charAt( 1 ) + hex.charAt( 1 ), 16 ) / 255;
					this.b = parseInt( hex.charAt( 2 ) + hex.charAt( 2 ), 16 ) / 255;

					return this;

				} else if ( size === 6 ) {

					// #ff0000
					this.r = parseInt( hex.charAt( 0 ) + hex.charAt( 1 ), 16 ) / 255;
					this.g = parseInt( hex.charAt( 2 ) + hex.charAt( 3 ), 16 ) / 255;
					this.b = parseInt( hex.charAt( 4 ) + hex.charAt( 5 ), 16 ) / 255;

					return this;

				}

			}

			if ( style && style.length > 0 ) {

				return this.setColorName( style );

			}

			return this;

		}

		setColorName( style ) {

			// color keywords
			const hex = _colorKeywords[ style.toLowerCase() ];

			if ( hex !== undefined ) {

				// red
				this.setHex( hex );

			} else {

				// unknown color
				console.warn( 'THREE.Color: Unknown color ' + style );

			}

			return this;

		}

		clone() {

			return new this.constructor( this.r, this.g, this.b );

		}

		copy( color ) {

			this.r = color.r;
			this.g = color.g;
			this.b = color.b;

			return this;

		}

		copyGammaToLinear( color, gammaFactor = 2.0 ) {

			this.r = Math.pow( color.r, gammaFactor );
			this.g = Math.pow( color.g, gammaFactor );
			this.b = Math.pow( color.b, gammaFactor );

			return this;

		}

		copyLinearToGamma( color, gammaFactor = 2.0 ) {

			const safeInverse = ( gammaFactor > 0 ) ? ( 1.0 / gammaFactor ) : 1.0;

			this.r = Math.pow( color.r, safeInverse );
			this.g = Math.pow( color.g, safeInverse );
			this.b = Math.pow( color.b, safeInverse );

			return this;

		}

		convertGammaToLinear( gammaFactor ) {

			this.copyGammaToLinear( this, gammaFactor );

			return this;

		}

		convertLinearToGamma( gammaFactor ) {

			this.copyLinearToGamma( this, gammaFactor );

			return this;

		}

		copySRGBToLinear( color ) {

			this.r = SRGBToLinear( color.r );
			this.g = SRGBToLinear( color.g );
			this.b = SRGBToLinear( color.b );

			return this;

		}

		copyLinearToSRGB( color ) {

			this.r = LinearToSRGB( color.r );
			this.g = LinearToSRGB( color.g );
			this.b = LinearToSRGB( color.b );

			return this;

		}

		convertSRGBToLinear() {

			this.copySRGBToLinear( this );

			return this;

		}

		convertLinearToSRGB() {

			this.copyLinearToSRGB( this );

			return this;

		}

		getHex() {

			return ( this.r * 255 ) << 16 ^ ( this.g * 255 ) << 8 ^ ( this.b * 255 ) << 0;

		}

		getHexString() {

			return ( '000000' + this.getHex().toString( 16 ) ).slice( - 6 );

		}

		getHSL( target ) {

			// h,s,l ranges are in 0.0 - 1.0

			const r = this.r, g = this.g, b = this.b;

			const max = Math.max( r, g, b );
			const min = Math.min( r, g, b );

			let hue, saturation;
			const lightness = ( min + max ) / 2.0;

			if ( min === max ) {

				hue = 0;
				saturation = 0;

			} else {

				const delta = max - min;

				saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );

				switch ( max ) {

					case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
					case g: hue = ( b - r ) / delta + 2; break;
					case b: hue = ( r - g ) / delta + 4; break;

				}

				hue /= 6;

			}

			target.h = hue;
			target.s = saturation;
			target.l = lightness;

			return target;

		}

		getStyle() {

			return 'rgb(' + ( ( this.r * 255 ) | 0 ) + ',' + ( ( this.g * 255 ) | 0 ) + ',' + ( ( this.b * 255 ) | 0 ) + ')';

		}

		offsetHSL( h, s, l ) {

			this.getHSL( _hslA );

			_hslA.h += h; _hslA.s += s; _hslA.l += l;

			this.setHSL( _hslA.h, _hslA.s, _hslA.l );

			return this;

		}

		add( color ) {

			this.r += color.r;
			this.g += color.g;
			this.b += color.b;

			return this;

		}

		addColors( color1, color2 ) {

			this.r = color1.r + color2.r;
			this.g = color1.g + color2.g;
			this.b = color1.b + color2.b;

			return this;

		}

		addScalar( s ) {

			this.r += s;
			this.g += s;
			this.b += s;

			return this;

		}

		sub( color ) {

			this.r = Math.max( 0, this.r - color.r );
			this.g = Math.max( 0, this.g - color.g );
			this.b = Math.max( 0, this.b - color.b );

			return this;

		}

		multiply( color ) {

			this.r *= color.r;
			this.g *= color.g;
			this.b *= color.b;

			return this;

		}

		multiplyScalar( s ) {

			this.r *= s;
			this.g *= s;
			this.b *= s;

			return this;

		}

		lerp( color, alpha ) {

			this.r += ( color.r - this.r ) * alpha;
			this.g += ( color.g - this.g ) * alpha;
			this.b += ( color.b - this.b ) * alpha;

			return this;

		}

		lerpColors( color1, color2, alpha ) {

			this.r = color1.r + ( color2.r - color1.r ) * alpha;
			this.g = color1.g + ( color2.g - color1.g ) * alpha;
			this.b = color1.b + ( color2.b - color1.b ) * alpha;

			return this;

		}

		lerpHSL( color, alpha ) {

			this.getHSL( _hslA );
			color.getHSL( _hslB );

			const h = lerp( _hslA.h, _hslB.h, alpha );
			const s = lerp( _hslA.s, _hslB.s, alpha );
			const l = lerp( _hslA.l, _hslB.l, alpha );

			this.setHSL( h, s, l );

			return this;

		}

		equals( c ) {

			return ( c.r === this.r ) && ( c.g === this.g ) && ( c.b === this.b );

		}

		fromArray( array, offset = 0 ) {

			this.r = array[ offset ];
			this.g = array[ offset + 1 ];
			this.b = array[ offset + 2 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.r;
			array[ offset + 1 ] = this.g;
			array[ offset + 2 ] = this.b;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this.r = attribute.getX( index );
			this.g = attribute.getY( index );
			this.b = attribute.getZ( index );

			if ( attribute.normalized === true ) {

				// assuming Uint8Array

				this.r /= 255;
				this.g /= 255;
				this.b /= 255;

			}

			return this;

		}

		toJSON() {

			return this.getHex();

		}

	}

	Color.NAMES = _colorKeywords;

	Color.prototype.isColor = true;
	Color.prototype.r = 1;
	Color.prototype.g = 1;
	Color.prototype.b = 1;

	/**
	 * parameters = {
	 *  color: <hex>,
	 *  opacity: <float>,
	 *  map: new THREE.Texture( <Image> ),
	 *
	 *  lightMap: new THREE.Texture( <Image> ),
	 *  lightMapIntensity: <float>
	 *
	 *  aoMap: new THREE.Texture( <Image> ),
	 *  aoMapIntensity: <float>
	 *
	 *  specularMap: new THREE.Texture( <Image> ),
	 *
	 *  alphaMap: new THREE.Texture( <Image> ),
	 *
	 *  envMap: new THREE.CubeTexture( [posx, negx, posy, negy, posz, negz] ),
	 *  combine: THREE.Multiply,
	 *  reflectivity: <float>,
	 *  refractionRatio: <float>,
	 *
	 *  depthTest: <bool>,
	 *  depthWrite: <bool>,
	 *
	 *  wireframe: <boolean>,
	 *  wireframeLinewidth: <float>,
	 * }
	 */

	class MeshBasicMaterial extends Material {

		constructor( parameters ) {

			super();

			this.type = 'MeshBasicMaterial';

			this.color = new Color( 0xffffff ); // emissive

			this.map = null;

			this.lightMap = null;
			this.lightMapIntensity = 1.0;

			this.aoMap = null;
			this.aoMapIntensity = 1.0;

			this.specularMap = null;

			this.alphaMap = null;

			this.envMap = null;
			this.combine = MultiplyOperation;
			this.reflectivity = 1;
			this.refractionRatio = 0.98;

			this.wireframe = false;
			this.wireframeLinewidth = 1;
			this.wireframeLinecap = 'round';
			this.wireframeLinejoin = 'round';

			this.setValues( parameters );

		}

		copy( source ) {

			super.copy( source );

			this.color.copy( source.color );

			this.map = source.map;

			this.lightMap = source.lightMap;
			this.lightMapIntensity = source.lightMapIntensity;

			this.aoMap = source.aoMap;
			this.aoMapIntensity = source.aoMapIntensity;

			this.specularMap = source.specularMap;

			this.alphaMap = source.alphaMap;

			this.envMap = source.envMap;
			this.combine = source.combine;
			this.reflectivity = source.reflectivity;
			this.refractionRatio = source.refractionRatio;

			this.wireframe = source.wireframe;
			this.wireframeLinewidth = source.wireframeLinewidth;
			this.wireframeLinecap = source.wireframeLinecap;
			this.wireframeLinejoin = source.wireframeLinejoin;

			return this;

		}

	}

	MeshBasicMaterial.prototype.isMeshBasicMaterial = true;

	class Vector4 {

		constructor( x = 0, y = 0, z = 0, w = 1 ) {

			this.x = x;
			this.y = y;
			this.z = z;
			this.w = w;

		}

		get width() {

			return this.z;

		}

		set width( value ) {

			this.z = value;

		}

		get height() {

			return this.w;

		}

		set height( value ) {

			this.w = value;

		}

		set( x, y, z, w ) {

			this.x = x;
			this.y = y;
			this.z = z;
			this.w = w;

			return this;

		}

		setScalar( scalar ) {

			this.x = scalar;
			this.y = scalar;
			this.z = scalar;
			this.w = scalar;

			return this;

		}

		setX( x ) {

			this.x = x;

			return this;

		}

		setY( y ) {

			this.y = y;

			return this;

		}

		setZ( z ) {

			this.z = z;

			return this;

		}

		setW( w ) {

			this.w = w;

			return this;

		}

		setComponent( index, value ) {

			switch ( index ) {

				case 0: this.x = value; break;
				case 1: this.y = value; break;
				case 2: this.z = value; break;
				case 3: this.w = value; break;
				default: throw new Error( 'index is out of range: ' + index );

			}

			return this;

		}

		getComponent( index ) {

			switch ( index ) {

				case 0: return this.x;
				case 1: return this.y;
				case 2: return this.z;
				case 3: return this.w;
				default: throw new Error( 'index is out of range: ' + index );

			}

		}

		clone() {

			return new this.constructor( this.x, this.y, this.z, this.w );

		}

		copy( v ) {

			this.x = v.x;
			this.y = v.y;
			this.z = v.z;
			this.w = ( v.w !== undefined ) ? v.w : 1;

			return this;

		}

		add( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector4: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
				return this.addVectors( v, w );

			}

			this.x += v.x;
			this.y += v.y;
			this.z += v.z;
			this.w += v.w;

			return this;

		}

		addScalar( s ) {

			this.x += s;
			this.y += s;
			this.z += s;
			this.w += s;

			return this;

		}

		addVectors( a, b ) {

			this.x = a.x + b.x;
			this.y = a.y + b.y;
			this.z = a.z + b.z;
			this.w = a.w + b.w;

			return this;

		}

		addScaledVector( v, s ) {

			this.x += v.x * s;
			this.y += v.y * s;
			this.z += v.z * s;
			this.w += v.w * s;

			return this;

		}

		sub( v, w ) {

			if ( w !== undefined ) {

				console.warn( 'THREE.Vector4: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
				return this.subVectors( v, w );

			}

			this.x -= v.x;
			this.y -= v.y;
			this.z -= v.z;
			this.w -= v.w;

			return this;

		}

		subScalar( s ) {

			this.x -= s;
			this.y -= s;
			this.z -= s;
			this.w -= s;

			return this;

		}

		subVectors( a, b ) {

			this.x = a.x - b.x;
			this.y = a.y - b.y;
			this.z = a.z - b.z;
			this.w = a.w - b.w;

			return this;

		}

		multiply( v ) {

			this.x *= v.x;
			this.y *= v.y;
			this.z *= v.z;
			this.w *= v.w;

			return this;

		}

		multiplyScalar( scalar ) {

			this.x *= scalar;
			this.y *= scalar;
			this.z *= scalar;
			this.w *= scalar;

			return this;

		}

		applyMatrix4( m ) {

			const x = this.x, y = this.y, z = this.z, w = this.w;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * w;
			this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * w;
			this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * w;
			this.w = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * w;

			return this;

		}

		divideScalar( scalar ) {

			return this.multiplyScalar( 1 / scalar );

		}

		setAxisAngleFromQuaternion( q ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm

			// q is assumed to be normalized

			this.w = 2 * Math.acos( q.w );

			const s = Math.sqrt( 1 - q.w * q.w );

			if ( s < 0.0001 ) {

				this.x = 1;
				this.y = 0;
				this.z = 0;

			} else {

				this.x = q.x / s;
				this.y = q.y / s;
				this.z = q.z / s;

			}

			return this;

		}

		setAxisAngleFromRotationMatrix( m ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			let angle, x, y, z; // variables for result
			const epsilon = 0.01,		// margin to allow for rounding errors
				epsilon2 = 0.1,		// margin to distinguish between 0 and 180 degrees

				te = m.elements,

				m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
				m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
				m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

			if ( ( Math.abs( m12 - m21 ) < epsilon ) &&
			     ( Math.abs( m13 - m31 ) < epsilon ) &&
			     ( Math.abs( m23 - m32 ) < epsilon ) ) {

				// singularity found
				// first check for identity matrix which must have +1 for all terms
				// in leading diagonal and zero in other terms

				if ( ( Math.abs( m12 + m21 ) < epsilon2 ) &&
				     ( Math.abs( m13 + m31 ) < epsilon2 ) &&
				     ( Math.abs( m23 + m32 ) < epsilon2 ) &&
				     ( Math.abs( m11 + m22 + m33 - 3 ) < epsilon2 ) ) {

					// this singularity is identity matrix so angle = 0

					this.set( 1, 0, 0, 0 );

					return this; // zero angle, arbitrary axis

				}

				// otherwise this singularity is angle = 180

				angle = Math.PI;

				const xx = ( m11 + 1 ) / 2;
				const yy = ( m22 + 1 ) / 2;
				const zz = ( m33 + 1 ) / 2;
				const xy = ( m12 + m21 ) / 4;
				const xz = ( m13 + m31 ) / 4;
				const yz = ( m23 + m32 ) / 4;

				if ( ( xx > yy ) && ( xx > zz ) ) {

					// m11 is the largest diagonal term

					if ( xx < epsilon ) {

						x = 0;
						y = 0.707106781;
						z = 0.707106781;

					} else {

						x = Math.sqrt( xx );
						y = xy / x;
						z = xz / x;

					}

				} else if ( yy > zz ) {

					// m22 is the largest diagonal term

					if ( yy < epsilon ) {

						x = 0.707106781;
						y = 0;
						z = 0.707106781;

					} else {

						y = Math.sqrt( yy );
						x = xy / y;
						z = yz / y;

					}

				} else {

					// m33 is the largest diagonal term so base result on this

					if ( zz < epsilon ) {

						x = 0.707106781;
						y = 0.707106781;
						z = 0;

					} else {

						z = Math.sqrt( zz );
						x = xz / z;
						y = yz / z;

					}

				}

				this.set( x, y, z, angle );

				return this; // return 180 deg rotation

			}

			// as we have reached here there are no singularities so we can handle normally

			let s = Math.sqrt( ( m32 - m23 ) * ( m32 - m23 ) +
				( m13 - m31 ) * ( m13 - m31 ) +
				( m21 - m12 ) * ( m21 - m12 ) ); // used to normalize

			if ( Math.abs( s ) < 0.001 ) s = 1;

			// prevent divide by zero, should not happen if matrix is orthogonal and should be
			// caught by singularity test above, but I've left it in just in case

			this.x = ( m32 - m23 ) / s;
			this.y = ( m13 - m31 ) / s;
			this.z = ( m21 - m12 ) / s;
			this.w = Math.acos( ( m11 + m22 + m33 - 1 ) / 2 );

			return this;

		}

		min( v ) {

			this.x = Math.min( this.x, v.x );
			this.y = Math.min( this.y, v.y );
			this.z = Math.min( this.z, v.z );
			this.w = Math.min( this.w, v.w );

			return this;

		}

		max( v ) {

			this.x = Math.max( this.x, v.x );
			this.y = Math.max( this.y, v.y );
			this.z = Math.max( this.z, v.z );
			this.w = Math.max( this.w, v.w );

			return this;

		}

		clamp( min, max ) {

			// assumes min < max, componentwise

			this.x = Math.max( min.x, Math.min( max.x, this.x ) );
			this.y = Math.max( min.y, Math.min( max.y, this.y ) );
			this.z = Math.max( min.z, Math.min( max.z, this.z ) );
			this.w = Math.max( min.w, Math.min( max.w, this.w ) );

			return this;

		}

		clampScalar( minVal, maxVal ) {

			this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
			this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
			this.z = Math.max( minVal, Math.min( maxVal, this.z ) );
			this.w = Math.max( minVal, Math.min( maxVal, this.w ) );

			return this;

		}

		clampLength( min, max ) {

			const length = this.length();

			return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

		}

		floor() {

			this.x = Math.floor( this.x );
			this.y = Math.floor( this.y );
			this.z = Math.floor( this.z );
			this.w = Math.floor( this.w );

			return this;

		}

		ceil() {

			this.x = Math.ceil( this.x );
			this.y = Math.ceil( this.y );
			this.z = Math.ceil( this.z );
			this.w = Math.ceil( this.w );

			return this;

		}

		round() {

			this.x = Math.round( this.x );
			this.y = Math.round( this.y );
			this.z = Math.round( this.z );
			this.w = Math.round( this.w );

			return this;

		}

		roundToZero() {

			this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
			this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
			this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );
			this.w = ( this.w < 0 ) ? Math.ceil( this.w ) : Math.floor( this.w );

			return this;

		}

		negate() {

			this.x = - this.x;
			this.y = - this.y;
			this.z = - this.z;
			this.w = - this.w;

			return this;

		}

		dot( v ) {

			return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;

		}

		lengthSq() {

			return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

		}

		length() {

			return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

		}

		manhattanLength() {

			return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z ) + Math.abs( this.w );

		}

		normalize() {

			return this.divideScalar( this.length() || 1 );

		}

		setLength( length ) {

			return this.normalize().multiplyScalar( length );

		}

		lerp( v, alpha ) {

			this.x += ( v.x - this.x ) * alpha;
			this.y += ( v.y - this.y ) * alpha;
			this.z += ( v.z - this.z ) * alpha;
			this.w += ( v.w - this.w ) * alpha;

			return this;

		}

		lerpVectors( v1, v2, alpha ) {

			this.x = v1.x + ( v2.x - v1.x ) * alpha;
			this.y = v1.y + ( v2.y - v1.y ) * alpha;
			this.z = v1.z + ( v2.z - v1.z ) * alpha;
			this.w = v1.w + ( v2.w - v1.w ) * alpha;

			return this;

		}

		equals( v ) {

			return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) && ( v.w === this.w ) );

		}

		fromArray( array, offset = 0 ) {

			this.x = array[ offset ];
			this.y = array[ offset + 1 ];
			this.z = array[ offset + 2 ];
			this.w = array[ offset + 3 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.x;
			array[ offset + 1 ] = this.y;
			array[ offset + 2 ] = this.z;
			array[ offset + 3 ] = this.w;

			return array;

		}

		fromBufferAttribute( attribute, index, offset ) {

			if ( offset !== undefined ) {

				console.warn( 'THREE.Vector4: offset has been removed from .fromBufferAttribute().' );

			}

			this.x = attribute.getX( index );
			this.y = attribute.getY( index );
			this.z = attribute.getZ( index );
			this.w = attribute.getW( index );

			return this;

		}

		random() {

			this.x = Math.random();
			this.y = Math.random();
			this.z = Math.random();
			this.w = Math.random();

			return this;

		}

		*[ Symbol.iterator ]() {

			yield this.x;
			yield this.y;
			yield this.z;
			yield this.w;

		}

	}

	Vector4.prototype.isVector4 = true;

	const _vector$1 = /*@__PURE__*/ new Vector3();
	const _vector2 = /*@__PURE__*/ new Vector2();

	class BufferAttribute {

		constructor( array, itemSize, normalized ) {

			if ( Array.isArray( array ) ) {

				throw new TypeError( 'THREE.BufferAttribute: array should be a Typed Array.' );

			}

			this.name = '';

			this.array = array;
			this.itemSize = itemSize;
			this.count = array !== undefined ? array.length / itemSize : 0;
			this.normalized = normalized === true;

			this.usage = StaticDrawUsage;
			this.updateRange = { offset: 0, count: - 1 };

			this.version = 0;

		}

		onUploadCallback() {}

		set needsUpdate( value ) {

			if ( value === true ) this.version ++;

		}

		setUsage( value ) {

			this.usage = value;

			return this;

		}

		copy( source ) {

			this.name = source.name;
			this.array = new source.array.constructor( source.array );
			this.itemSize = source.itemSize;
			this.count = source.count;
			this.normalized = source.normalized;

			this.usage = source.usage;

			return this;

		}

		copyAt( index1, attribute, index2 ) {

			index1 *= this.itemSize;
			index2 *= attribute.itemSize;

			for ( let i = 0, l = this.itemSize; i < l; i ++ ) {

				this.array[ index1 + i ] = attribute.array[ index2 + i ];

			}

			return this;

		}

		copyArray( array ) {

			this.array.set( array );

			return this;

		}

		copyColorsArray( colors ) {

			const array = this.array;
			let offset = 0;

			for ( let i = 0, l = colors.length; i < l; i ++ ) {

				let color = colors[ i ];

				if ( color === undefined ) {

					console.warn( 'THREE.BufferAttribute.copyColorsArray(): color is undefined', i );
					color = new Color();

				}

				array[ offset ++ ] = color.r;
				array[ offset ++ ] = color.g;
				array[ offset ++ ] = color.b;

			}

			return this;

		}

		copyVector2sArray( vectors ) {

			const array = this.array;
			let offset = 0;

			for ( let i = 0, l = vectors.length; i < l; i ++ ) {

				let vector = vectors[ i ];

				if ( vector === undefined ) {

					console.warn( 'THREE.BufferAttribute.copyVector2sArray(): vector is undefined', i );
					vector = new Vector2();

				}

				array[ offset ++ ] = vector.x;
				array[ offset ++ ] = vector.y;

			}

			return this;

		}

		copyVector3sArray( vectors ) {

			const array = this.array;
			let offset = 0;

			for ( let i = 0, l = vectors.length; i < l; i ++ ) {

				let vector = vectors[ i ];

				if ( vector === undefined ) {

					console.warn( 'THREE.BufferAttribute.copyVector3sArray(): vector is undefined', i );
					vector = new Vector3();

				}

				array[ offset ++ ] = vector.x;
				array[ offset ++ ] = vector.y;
				array[ offset ++ ] = vector.z;

			}

			return this;

		}

		copyVector4sArray( vectors ) {

			const array = this.array;
			let offset = 0;

			for ( let i = 0, l = vectors.length; i < l; i ++ ) {

				let vector = vectors[ i ];

				if ( vector === undefined ) {

					console.warn( 'THREE.BufferAttribute.copyVector4sArray(): vector is undefined', i );
					vector = new Vector4();

				}

				array[ offset ++ ] = vector.x;
				array[ offset ++ ] = vector.y;
				array[ offset ++ ] = vector.z;
				array[ offset ++ ] = vector.w;

			}

			return this;

		}

		applyMatrix3( m ) {

			if ( this.itemSize === 2 ) {

				for ( let i = 0, l = this.count; i < l; i ++ ) {

					_vector2.fromBufferAttribute( this, i );
					_vector2.applyMatrix3( m );

					this.setXY( i, _vector2.x, _vector2.y );

				}

			} else if ( this.itemSize === 3 ) {

				for ( let i = 0, l = this.count; i < l; i ++ ) {

					_vector$1.fromBufferAttribute( this, i );
					_vector$1.applyMatrix3( m );

					this.setXYZ( i, _vector$1.x, _vector$1.y, _vector$1.z );

				}

			}

			return this;

		}

		applyMatrix4( m ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector$1.x = this.getX( i );
				_vector$1.y = this.getY( i );
				_vector$1.z = this.getZ( i );

				_vector$1.applyMatrix4( m );

				this.setXYZ( i, _vector$1.x, _vector$1.y, _vector$1.z );

			}

			return this;

		}

		applyNormalMatrix( m ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector$1.x = this.getX( i );
				_vector$1.y = this.getY( i );
				_vector$1.z = this.getZ( i );

				_vector$1.applyNormalMatrix( m );

				this.setXYZ( i, _vector$1.x, _vector$1.y, _vector$1.z );

			}

			return this;

		}

		transformDirection( m ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector$1.x = this.getX( i );
				_vector$1.y = this.getY( i );
				_vector$1.z = this.getZ( i );

				_vector$1.transformDirection( m );

				this.setXYZ( i, _vector$1.x, _vector$1.y, _vector$1.z );

			}

			return this;

		}

		set( value, offset = 0 ) {

			this.array.set( value, offset );

			return this;

		}

		getX( index ) {

			return this.array[ index * this.itemSize ];

		}

		setX( index, x ) {

			this.array[ index * this.itemSize ] = x;

			return this;

		}

		getY( index ) {

			return this.array[ index * this.itemSize + 1 ];

		}

		setY( index, y ) {

			this.array[ index * this.itemSize + 1 ] = y;

			return this;

		}

		getZ( index ) {

			return this.array[ index * this.itemSize + 2 ];

		}

		setZ( index, z ) {

			this.array[ index * this.itemSize + 2 ] = z;

			return this;

		}

		getW( index ) {

			return this.array[ index * this.itemSize + 3 ];

		}

		setW( index, w ) {

			this.array[ index * this.itemSize + 3 ] = w;

			return this;

		}

		setXY( index, x, y ) {

			index *= this.itemSize;

			this.array[ index + 0 ] = x;
			this.array[ index + 1 ] = y;

			return this;

		}

		setXYZ( index, x, y, z ) {

			index *= this.itemSize;

			this.array[ index + 0 ] = x;
			this.array[ index + 1 ] = y;
			this.array[ index + 2 ] = z;

			return this;

		}

		setXYZW( index, x, y, z, w ) {

			index *= this.itemSize;

			this.array[ index + 0 ] = x;
			this.array[ index + 1 ] = y;
			this.array[ index + 2 ] = z;
			this.array[ index + 3 ] = w;

			return this;

		}

		onUpload( callback ) {

			this.onUploadCallback = callback;

			return this;

		}

		clone() {

			return new this.constructor( this.array, this.itemSize ).copy( this );

		}

		toJSON() {

			const data = {
				itemSize: this.itemSize,
				type: this.array.constructor.name,
				array: Array.prototype.slice.call( this.array ),
				normalized: this.normalized
			};

			if ( this.name !== '' ) data.name = this.name;
			if ( this.usage !== StaticDrawUsage ) data.usage = this.usage;
			if ( this.updateRange.offset !== 0 || this.updateRange.count !== - 1 ) data.updateRange = this.updateRange;

			return data;

		}

	}

	BufferAttribute.prototype.isBufferAttribute = true;

	class Uint16BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint16Array( array ), itemSize, normalized );

		}

	}

	class Uint32BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint32Array( array ), itemSize, normalized );

		}

	}

	class Float16BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint16Array( array ), itemSize, normalized );

		}

	}

	Float16BufferAttribute.prototype.isFloat16BufferAttribute = true;

	class Float32BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Float32Array( array ), itemSize, normalized );

		}

	}

	function arrayMax( array ) {

		if ( array.length === 0 ) return - Infinity;

		let max = array[ 0 ];

		for ( let i = 1, l = array.length; i < l; ++ i ) {

			if ( array[ i ] > max ) max = array[ i ];

		}

		return max;

	}

	function createElementNS( name ) {

		return document.createElementNS( 'http://www.w3.org/1999/xhtml', name );

	}

	let _id = 0;

	const _m1 = /*@__PURE__*/ new Matrix4();
	const _obj = /*@__PURE__*/ new Object3D();
	const _offset = /*@__PURE__*/ new Vector3();
	const _box = /*@__PURE__*/ new Box3();
	const _boxMorphTargets = /*@__PURE__*/ new Box3();
	const _vector = /*@__PURE__*/ new Vector3();

	class BufferGeometry extends EventDispatcher {

		constructor() {

			super();

			Object.defineProperty( this, 'id', { value: _id ++ } );

			this.uuid = generateUUID();

			this.name = '';
			this.type = 'BufferGeometry';

			this.index = null;
			this.attributes = {};

			this.morphAttributes = {};
			this.morphTargetsRelative = false;

			this.groups = [];

			this.boundingBox = null;
			this.boundingSphere = null;

			this.drawRange = { start: 0, count: Infinity };

			this.userData = {};

		}

		getIndex() {

			return this.index;

		}

		setIndex( index ) {

			if ( Array.isArray( index ) ) {

				this.index = new ( arrayMax( index ) > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute )( index, 1 );

			} else {

				this.index = index;

			}

			return this;

		}

		getAttribute( name ) {

			return this.attributes[ name ];

		}

		setAttribute( name, attribute ) {

			this.attributes[ name ] = attribute;

			return this;

		}

		deleteAttribute( name ) {

			delete this.attributes[ name ];

			return this;

		}

		hasAttribute( name ) {

			return this.attributes[ name ] !== undefined;

		}

		addGroup( start, count, materialIndex = 0 ) {

			this.groups.push( {

				start: start,
				count: count,
				materialIndex: materialIndex

			} );

		}

		clearGroups() {

			this.groups = [];

		}

		setDrawRange( start, count ) {

			this.drawRange.start = start;
			this.drawRange.count = count;

		}

		applyMatrix4( matrix ) {

			const position = this.attributes.position;

			if ( position !== undefined ) {

				position.applyMatrix4( matrix );

				position.needsUpdate = true;

			}

			const normal = this.attributes.normal;

			if ( normal !== undefined ) {

				const normalMatrix = new Matrix3().getNormalMatrix( matrix );

				normal.applyNormalMatrix( normalMatrix );

				normal.needsUpdate = true;

			}

			const tangent = this.attributes.tangent;

			if ( tangent !== undefined ) {

				tangent.transformDirection( matrix );

				tangent.needsUpdate = true;

			}

			if ( this.boundingBox !== null ) {

				this.computeBoundingBox();

			}

			if ( this.boundingSphere !== null ) {

				this.computeBoundingSphere();

			}

			return this;

		}

		applyQuaternion( q ) {

			_m1.makeRotationFromQuaternion( q );

			this.applyMatrix4( _m1 );

			return this;

		}

		rotateX( angle ) {

			// rotate geometry around world x-axis

			_m1.makeRotationX( angle );

			this.applyMatrix4( _m1 );

			return this;

		}

		rotateY( angle ) {

			// rotate geometry around world y-axis

			_m1.makeRotationY( angle );

			this.applyMatrix4( _m1 );

			return this;

		}

		rotateZ( angle ) {

			// rotate geometry around world z-axis

			_m1.makeRotationZ( angle );

			this.applyMatrix4( _m1 );

			return this;

		}

		translate( x, y, z ) {

			// translate geometry

			_m1.makeTranslation( x, y, z );

			this.applyMatrix4( _m1 );

			return this;

		}

		scale( x, y, z ) {

			// scale geometry

			_m1.makeScale( x, y, z );

			this.applyMatrix4( _m1 );

			return this;

		}

		lookAt( vector ) {

			_obj.lookAt( vector );

			_obj.updateMatrix();

			this.applyMatrix4( _obj.matrix );

			return this;

		}

		center() {

			this.computeBoundingBox();

			this.boundingBox.getCenter( _offset ).negate();

			this.translate( _offset.x, _offset.y, _offset.z );

			return this;

		}

		setFromPoints( points ) {

			const position = [];

			for ( let i = 0, l = points.length; i < l; i ++ ) {

				const point = points[ i ];
				position.push( point.x, point.y, point.z || 0 );

			}

			this.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );

			return this;

		}

		computeBoundingBox() {

			if ( this.boundingBox === null ) {

				this.boundingBox = new Box3();

			}

			const position = this.attributes.position;
			const morphAttributesPosition = this.morphAttributes.position;

			if ( position && position.isGLBufferAttribute ) {

				console.error( 'THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".', this );

				this.boundingBox.set(
					new Vector3( - Infinity, - Infinity, - Infinity ),
					new Vector3( + Infinity, + Infinity, + Infinity )
				);

				return;

			}

			if ( position !== undefined ) {

				this.boundingBox.setFromBufferAttribute( position );

				// process morph attributes if present

				if ( morphAttributesPosition ) {

					for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

						const morphAttribute = morphAttributesPosition[ i ];
						_box.setFromBufferAttribute( morphAttribute );

						if ( this.morphTargetsRelative ) {

							_vector.addVectors( this.boundingBox.min, _box.min );
							this.boundingBox.expandByPoint( _vector );

							_vector.addVectors( this.boundingBox.max, _box.max );
							this.boundingBox.expandByPoint( _vector );

						} else {

							this.boundingBox.expandByPoint( _box.min );
							this.boundingBox.expandByPoint( _box.max );

						}

					}

				}

			} else {

				this.boundingBox.makeEmpty();

			}

			if ( isNaN( this.boundingBox.min.x ) || isNaN( this.boundingBox.min.y ) || isNaN( this.boundingBox.min.z ) ) {

				console.error( 'THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this );

			}

		}

		computeBoundingSphere() {

			if ( this.boundingSphere === null ) {

				this.boundingSphere = new Sphere();

			}

			const position = this.attributes.position;
			const morphAttributesPosition = this.morphAttributes.position;

			if ( position && position.isGLBufferAttribute ) {

				console.error( 'THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".', this );

				this.boundingSphere.set( new Vector3(), Infinity );

				return;

			}

			if ( position ) {

				// first, find the center of the bounding sphere

				const center = this.boundingSphere.center;

				_box.setFromBufferAttribute( position );

				// process morph attributes if present

				if ( morphAttributesPosition ) {

					for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

						const morphAttribute = morphAttributesPosition[ i ];
						_boxMorphTargets.setFromBufferAttribute( morphAttribute );

						if ( this.morphTargetsRelative ) {

							_vector.addVectors( _box.min, _boxMorphTargets.min );
							_box.expandByPoint( _vector );

							_vector.addVectors( _box.max, _boxMorphTargets.max );
							_box.expandByPoint( _vector );

						} else {

							_box.expandByPoint( _boxMorphTargets.min );
							_box.expandByPoint( _boxMorphTargets.max );

						}

					}

				}

				_box.getCenter( center );

				// second, try to find a boundingSphere with a radius smaller than the
				// boundingSphere of the boundingBox: sqrt(3) smaller in the best case

				let maxRadiusSq = 0;

				for ( let i = 0, il = position.count; i < il; i ++ ) {

					_vector.fromBufferAttribute( position, i );

					maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector ) );

				}

				// process morph attributes if present

				if ( morphAttributesPosition ) {

					for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

						const morphAttribute = morphAttributesPosition[ i ];
						const morphTargetsRelative = this.morphTargetsRelative;

						for ( let j = 0, jl = morphAttribute.count; j < jl; j ++ ) {

							_vector.fromBufferAttribute( morphAttribute, j );

							if ( morphTargetsRelative ) {

								_offset.fromBufferAttribute( position, j );
								_vector.add( _offset );

							}

							maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector ) );

						}

					}

				}

				this.boundingSphere.radius = Math.sqrt( maxRadiusSq );

				if ( isNaN( this.boundingSphere.radius ) ) {

					console.error( 'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this );

				}

			}

		}

		computeTangents() {

			const index = this.index;
			const attributes = this.attributes;

			// based on http://www.terathon.com/code/tangent.html
			// (per vertex tangents)

			if ( index === null ||
				 attributes.position === undefined ||
				 attributes.normal === undefined ||
				 attributes.uv === undefined ) {

				console.error( 'THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)' );
				return;

			}

			const indices = index.array;
			const positions = attributes.position.array;
			const normals = attributes.normal.array;
			const uvs = attributes.uv.array;

			const nVertices = positions.length / 3;

			if ( attributes.tangent === undefined ) {

				this.setAttribute( 'tangent', new BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );

			}

			const tangents = attributes.tangent.array;

			const tan1 = [], tan2 = [];

			for ( let i = 0; i < nVertices; i ++ ) {

				tan1[ i ] = new Vector3();
				tan2[ i ] = new Vector3();

			}

			const vA = new Vector3(),
				vB = new Vector3(),
				vC = new Vector3(),

				uvA = new Vector2(),
				uvB = new Vector2(),
				uvC = new Vector2(),

				sdir = new Vector3(),
				tdir = new Vector3();

			function handleTriangle( a, b, c ) {

				vA.fromArray( positions, a * 3 );
				vB.fromArray( positions, b * 3 );
				vC.fromArray( positions, c * 3 );

				uvA.fromArray( uvs, a * 2 );
				uvB.fromArray( uvs, b * 2 );
				uvC.fromArray( uvs, c * 2 );

				vB.sub( vA );
				vC.sub( vA );

				uvB.sub( uvA );
				uvC.sub( uvA );

				const r = 1.0 / ( uvB.x * uvC.y - uvC.x * uvB.y );

				// silently ignore degenerate uv triangles having coincident or colinear vertices

				if ( ! isFinite( r ) ) return;

				sdir.copy( vB ).multiplyScalar( uvC.y ).addScaledVector( vC, - uvB.y ).multiplyScalar( r );
				tdir.copy( vC ).multiplyScalar( uvB.x ).addScaledVector( vB, - uvC.x ).multiplyScalar( r );

				tan1[ a ].add( sdir );
				tan1[ b ].add( sdir );
				tan1[ c ].add( sdir );

				tan2[ a ].add( tdir );
				tan2[ b ].add( tdir );
				tan2[ c ].add( tdir );

			}

			let groups = this.groups;

			if ( groups.length === 0 ) {

				groups = [ {
					start: 0,
					count: indices.length
				} ];

			}

			for ( let i = 0, il = groups.length; i < il; ++ i ) {

				const group = groups[ i ];

				const start = group.start;
				const count = group.count;

				for ( let j = start, jl = start + count; j < jl; j += 3 ) {

					handleTriangle(
						indices[ j + 0 ],
						indices[ j + 1 ],
						indices[ j + 2 ]
					);

				}

			}

			const tmp = new Vector3(), tmp2 = new Vector3();
			const n = new Vector3(), n2 = new Vector3();

			function handleVertex( v ) {

				n.fromArray( normals, v * 3 );
				n2.copy( n );

				const t = tan1[ v ];

				// Gram-Schmidt orthogonalize

				tmp.copy( t );
				tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

				// Calculate handedness

				tmp2.crossVectors( n2, t );
				const test = tmp2.dot( tan2[ v ] );
				const w = ( test < 0.0 ) ? - 1.0 : 1.0;

				tangents[ v * 4 ] = tmp.x;
				tangents[ v * 4 + 1 ] = tmp.y;
				tangents[ v * 4 + 2 ] = tmp.z;
				tangents[ v * 4 + 3 ] = w;

			}

			for ( let i = 0, il = groups.length; i < il; ++ i ) {

				const group = groups[ i ];

				const start = group.start;
				const count = group.count;

				for ( let j = start, jl = start + count; j < jl; j += 3 ) {

					handleVertex( indices[ j + 0 ] );
					handleVertex( indices[ j + 1 ] );
					handleVertex( indices[ j + 2 ] );

				}

			}

		}

		computeVertexNormals() {

			const index = this.index;
			const positionAttribute = this.getAttribute( 'position' );

			if ( positionAttribute !== undefined ) {

				let normalAttribute = this.getAttribute( 'normal' );

				if ( normalAttribute === undefined ) {

					normalAttribute = new BufferAttribute( new Float32Array( positionAttribute.count * 3 ), 3 );
					this.setAttribute( 'normal', normalAttribute );

				} else {

					// reset existing normals to zero

					for ( let i = 0, il = normalAttribute.count; i < il; i ++ ) {

						normalAttribute.setXYZ( i, 0, 0, 0 );

					}

				}

				const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
				const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
				const cb = new Vector3(), ab = new Vector3();

				// indexed elements

				if ( index ) {

					for ( let i = 0, il = index.count; i < il; i += 3 ) {

						const vA = index.getX( i + 0 );
						const vB = index.getX( i + 1 );
						const vC = index.getX( i + 2 );

						pA.fromBufferAttribute( positionAttribute, vA );
						pB.fromBufferAttribute( positionAttribute, vB );
						pC.fromBufferAttribute( positionAttribute, vC );

						cb.subVectors( pC, pB );
						ab.subVectors( pA, pB );
						cb.cross( ab );

						nA.fromBufferAttribute( normalAttribute, vA );
						nB.fromBufferAttribute( normalAttribute, vB );
						nC.fromBufferAttribute( normalAttribute, vC );

						nA.add( cb );
						nB.add( cb );
						nC.add( cb );

						normalAttribute.setXYZ( vA, nA.x, nA.y, nA.z );
						normalAttribute.setXYZ( vB, nB.x, nB.y, nB.z );
						normalAttribute.setXYZ( vC, nC.x, nC.y, nC.z );

					}

				} else {

					// non-indexed elements (unconnected triangle soup)

					for ( let i = 0, il = positionAttribute.count; i < il; i += 3 ) {

						pA.fromBufferAttribute( positionAttribute, i + 0 );
						pB.fromBufferAttribute( positionAttribute, i + 1 );
						pC.fromBufferAttribute( positionAttribute, i + 2 );

						cb.subVectors( pC, pB );
						ab.subVectors( pA, pB );
						cb.cross( ab );

						normalAttribute.setXYZ( i + 0, cb.x, cb.y, cb.z );
						normalAttribute.setXYZ( i + 1, cb.x, cb.y, cb.z );
						normalAttribute.setXYZ( i + 2, cb.x, cb.y, cb.z );

					}

				}

				this.normalizeNormals();

				normalAttribute.needsUpdate = true;

			}

		}

		merge( geometry, offset ) {

			if ( ! ( geometry && geometry.isBufferGeometry ) ) {

				console.error( 'THREE.BufferGeometry.merge(): geometry not an instance of THREE.BufferGeometry.', geometry );
				return;

			}

			if ( offset === undefined ) {

				offset = 0;

				console.warn(
					'THREE.BufferGeometry.merge(): Overwriting original geometry, starting at offset=0. '
					+ 'Use BufferGeometryUtils.mergeBufferGeometries() for lossless merge.'
				);

			}

			const attributes = this.attributes;

			for ( const key in attributes ) {

				if ( geometry.attributes[ key ] === undefined ) continue;

				const attribute1 = attributes[ key ];
				const attributeArray1 = attribute1.array;

				const attribute2 = geometry.attributes[ key ];
				const attributeArray2 = attribute2.array;

				const attributeOffset = attribute2.itemSize * offset;
				const length = Math.min( attributeArray2.length, attributeArray1.length - attributeOffset );

				for ( let i = 0, j = attributeOffset; i < length; i ++, j ++ ) {

					attributeArray1[ j ] = attributeArray2[ i ];

				}

			}

			return this;

		}

		normalizeNormals() {

			const normals = this.attributes.normal;

			for ( let i = 0, il = normals.count; i < il; i ++ ) {

				_vector.fromBufferAttribute( normals, i );

				_vector.normalize();

				normals.setXYZ( i, _vector.x, _vector.y, _vector.z );

			}

		}

		toNonIndexed() {

			function convertBufferAttribute( attribute, indices ) {

				const array = attribute.array;
				const itemSize = attribute.itemSize;
				const normalized = attribute.normalized;

				const array2 = new array.constructor( indices.length * itemSize );

				let index = 0, index2 = 0;

				for ( let i = 0, l = indices.length; i < l; i ++ ) {

					if ( attribute.isInterleavedBufferAttribute ) {

						index = indices[ i ] * attribute.data.stride + attribute.offset;

					} else {

						index = indices[ i ] * itemSize;

					}

					for ( let j = 0; j < itemSize; j ++ ) {

						array2[ index2 ++ ] = array[ index ++ ];

					}

				}

				return new BufferAttribute( array2, itemSize, normalized );

			}

			//

			if ( this.index === null ) {

				console.warn( 'THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.' );
				return this;

			}

			const geometry2 = new BufferGeometry();

			const indices = this.index.array;
			const attributes = this.attributes;

			// attributes

			for ( const name in attributes ) {

				const attribute = attributes[ name ];

				const newAttribute = convertBufferAttribute( attribute, indices );

				geometry2.setAttribute( name, newAttribute );

			}

			// morph attributes

			const morphAttributes = this.morphAttributes;

			for ( const name in morphAttributes ) {

				const morphArray = [];
				const morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

				for ( let i = 0, il = morphAttribute.length; i < il; i ++ ) {

					const attribute = morphAttribute[ i ];

					const newAttribute = convertBufferAttribute( attribute, indices );

					morphArray.push( newAttribute );

				}

				geometry2.morphAttributes[ name ] = morphArray;

			}

			geometry2.morphTargetsRelative = this.morphTargetsRelative;

			// groups

			const groups = this.groups;

			for ( let i = 0, l = groups.length; i < l; i ++ ) {

				const group = groups[ i ];
				geometry2.addGroup( group.start, group.count, group.materialIndex );

			}

			return geometry2;

		}

		toJSON() {

			const data = {
				metadata: {
					version: 4.5,
					type: 'BufferGeometry',
					generator: 'BufferGeometry.toJSON'
				}
			};

			// standard BufferGeometry serialization

			data.uuid = this.uuid;
			data.type = this.type;
			if ( this.name !== '' ) data.name = this.name;
			if ( Object.keys( this.userData ).length > 0 ) data.userData = this.userData;

			if ( this.parameters !== undefined ) {

				const parameters = this.parameters;

				for ( const key in parameters ) {

					if ( parameters[ key ] !== undefined ) data[ key ] = parameters[ key ];

				}

				return data;

			}

			// for simplicity the code assumes attributes are not shared across geometries, see #15811

			data.data = { attributes: {} };

			const index = this.index;

			if ( index !== null ) {

				data.data.index = {
					type: index.array.constructor.name,
					array: Array.prototype.slice.call( index.array )
				};

			}

			const attributes = this.attributes;

			for ( const key in attributes ) {

				const attribute = attributes[ key ];

				data.data.attributes[ key ] = attribute.toJSON( data.data );

			}

			const morphAttributes = {};
			let hasMorphAttributes = false;

			for ( const key in this.morphAttributes ) {

				const attributeArray = this.morphAttributes[ key ];

				const array = [];

				for ( let i = 0, il = attributeArray.length; i < il; i ++ ) {

					const attribute = attributeArray[ i ];

					array.push( attribute.toJSON( data.data ) );

				}

				if ( array.length > 0 ) {

					morphAttributes[ key ] = array;

					hasMorphAttributes = true;

				}

			}

			if ( hasMorphAttributes ) {

				data.data.morphAttributes = morphAttributes;
				data.data.morphTargetsRelative = this.morphTargetsRelative;

			}

			const groups = this.groups;

			if ( groups.length > 0 ) {

				data.data.groups = JSON.parse( JSON.stringify( groups ) );

			}

			const boundingSphere = this.boundingSphere;

			if ( boundingSphere !== null ) {

				data.data.boundingSphere = {
					center: boundingSphere.center.toArray(),
					radius: boundingSphere.radius
				};

			}

			return data;

		}

		clone() {

			 return new this.constructor().copy( this );

		}

		copy( source ) {

			// reset

			this.index = null;
			this.attributes = {};
			this.morphAttributes = {};
			this.groups = [];
			this.boundingBox = null;
			this.boundingSphere = null;

			// used for storing cloned, shared data

			const data = {};

			// name

			this.name = source.name;

			// index

			const index = source.index;

			if ( index !== null ) {

				this.setIndex( index.clone( data ) );

			}

			// attributes

			const attributes = source.attributes;

			for ( const name in attributes ) {

				const attribute = attributes[ name ];
				this.setAttribute( name, attribute.clone( data ) );

			}

			// morph attributes

			const morphAttributes = source.morphAttributes;

			for ( const name in morphAttributes ) {

				const array = [];
				const morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

				for ( let i = 0, l = morphAttribute.length; i < l; i ++ ) {

					array.push( morphAttribute[ i ].clone( data ) );

				}

				this.morphAttributes[ name ] = array;

			}

			this.morphTargetsRelative = source.morphTargetsRelative;

			// groups

			const groups = source.groups;

			for ( let i = 0, l = groups.length; i < l; i ++ ) {

				const group = groups[ i ];
				this.addGroup( group.start, group.count, group.materialIndex );

			}

			// bounding box

			const boundingBox = source.boundingBox;

			if ( boundingBox !== null ) {

				this.boundingBox = boundingBox.clone();

			}

			// bounding sphere

			const boundingSphere = source.boundingSphere;

			if ( boundingSphere !== null ) {

				this.boundingSphere = boundingSphere.clone();

			}

			// draw range

			this.drawRange.start = source.drawRange.start;
			this.drawRange.count = source.drawRange.count;

			// user data

			this.userData = source.userData;

			// geometry generator parameters

			if ( source.parameters !== undefined ) this.parameters = Object.assign( {}, source.parameters );

			return this;

		}

		dispose() {

			this.dispatchEvent( { type: 'dispose' } );

		}

	}

	BufferGeometry.prototype.isBufferGeometry = true;

	const _inverseMatrix$1 = /*@__PURE__*/ new Matrix4();
	const _ray$1 = /*@__PURE__*/ new Ray();
	const _sphere$1 = /*@__PURE__*/ new Sphere();

	const _vA = /*@__PURE__*/ new Vector3();
	const _vB = /*@__PURE__*/ new Vector3();
	const _vC = /*@__PURE__*/ new Vector3();

	const _tempA = /*@__PURE__*/ new Vector3();
	const _tempB = /*@__PURE__*/ new Vector3();
	const _tempC = /*@__PURE__*/ new Vector3();

	const _morphA = /*@__PURE__*/ new Vector3();
	const _morphB = /*@__PURE__*/ new Vector3();
	const _morphC = /*@__PURE__*/ new Vector3();

	const _uvA = /*@__PURE__*/ new Vector2();
	const _uvB = /*@__PURE__*/ new Vector2();
	const _uvC = /*@__PURE__*/ new Vector2();

	const _intersectionPoint = /*@__PURE__*/ new Vector3();
	const _intersectionPointWorld = /*@__PURE__*/ new Vector3();

	class Mesh extends Object3D {

		constructor( geometry = new BufferGeometry(), material = new MeshBasicMaterial() ) {

			super();

			this.type = 'Mesh';

			this.geometry = geometry;
			this.material = material;

			this.updateMorphTargets();

		}

		copy( source ) {

			super.copy( source );

			if ( source.morphTargetInfluences !== undefined ) {

				this.morphTargetInfluences = source.morphTargetInfluences.slice();

			}

			if ( source.morphTargetDictionary !== undefined ) {

				this.morphTargetDictionary = Object.assign( {}, source.morphTargetDictionary );

			}

			this.material = source.material;
			this.geometry = source.geometry;

			return this;

		}

		updateMorphTargets() {

			const geometry = this.geometry;

			if ( geometry.isBufferGeometry ) {

				const morphAttributes = geometry.morphAttributes;
				const keys = Object.keys( morphAttributes );

				if ( keys.length > 0 ) {

					const morphAttribute = morphAttributes[ keys[ 0 ] ];

					if ( morphAttribute !== undefined ) {

						this.morphTargetInfluences = [];
						this.morphTargetDictionary = {};

						for ( let m = 0, ml = morphAttribute.length; m < ml; m ++ ) {

							const name = morphAttribute[ m ].name || String( m );

							this.morphTargetInfluences.push( 0 );
							this.morphTargetDictionary[ name ] = m;

						}

					}

				}

			} else {

				const morphTargets = geometry.morphTargets;

				if ( morphTargets !== undefined && morphTargets.length > 0 ) {

					console.error( 'THREE.Mesh.updateMorphTargets() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.' );

				}

			}

		}

		raycast( raycaster, intersects ) {

			const geometry = this.geometry;
			const material = this.material;
			const matrixWorld = this.matrixWorld;

			if ( material === undefined ) return;

			// Checking boundingSphere distance to ray

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			_sphere$1.copy( geometry.boundingSphere );
			_sphere$1.applyMatrix4( matrixWorld );

			if ( raycaster.ray.intersectsSphere( _sphere$1 ) === false ) return;

			//

			_inverseMatrix$1.copy( matrixWorld ).invert();
			_ray$1.copy( raycaster.ray ).applyMatrix4( _inverseMatrix$1 );

			// Check boundingBox before continuing

			if ( geometry.boundingBox !== null ) {

				if ( _ray$1.intersectsBox( geometry.boundingBox ) === false ) return;

			}

			let intersection;

			if ( geometry.isBufferGeometry ) {

				const index = geometry.index;
				const position = geometry.attributes.position;
				const morphPosition = geometry.morphAttributes.position;
				const morphTargetsRelative = geometry.morphTargetsRelative;
				const uv = geometry.attributes.uv;
				const uv2 = geometry.attributes.uv2;
				const groups = geometry.groups;
				const drawRange = geometry.drawRange;

				if ( index !== null ) {

					// indexed buffer geometry

					if ( Array.isArray( material ) ) {

						for ( let i = 0, il = groups.length; i < il; i ++ ) {

							const group = groups[ i ];
							const groupMaterial = material[ group.materialIndex ];

							const start = Math.max( group.start, drawRange.start );
							const end = Math.min( index.count, Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) ) );

							for ( let j = start, jl = end; j < jl; j += 3 ) {

								const a = index.getX( j );
								const b = index.getX( j + 1 );
								const c = index.getX( j + 2 );

								intersection = checkBufferGeometryIntersection( this, groupMaterial, raycaster, _ray$1, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c );

								if ( intersection ) {

									intersection.faceIndex = Math.floor( j / 3 ); // triangle number in indexed buffer semantics
									intersection.face.materialIndex = group.materialIndex;
									intersects.push( intersection );

								}

							}

						}

					} else {

						const start = Math.max( 0, drawRange.start );
						const end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

						for ( let i = start, il = end; i < il; i += 3 ) {

							const a = index.getX( i );
							const b = index.getX( i + 1 );
							const c = index.getX( i + 2 );

							intersection = checkBufferGeometryIntersection( this, material, raycaster, _ray$1, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c );

							if ( intersection ) {

								intersection.faceIndex = Math.floor( i / 3 ); // triangle number in indexed buffer semantics
								intersects.push( intersection );

							}

						}

					}

				} else if ( position !== undefined ) {

					// non-indexed buffer geometry

					if ( Array.isArray( material ) ) {

						for ( let i = 0, il = groups.length; i < il; i ++ ) {

							const group = groups[ i ];
							const groupMaterial = material[ group.materialIndex ];

							const start = Math.max( group.start, drawRange.start );
							const end = Math.min( position.count, Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) ) );

							for ( let j = start, jl = end; j < jl; j += 3 ) {

								const a = j;
								const b = j + 1;
								const c = j + 2;

								intersection = checkBufferGeometryIntersection( this, groupMaterial, raycaster, _ray$1, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c );

								if ( intersection ) {

									intersection.faceIndex = Math.floor( j / 3 ); // triangle number in non-indexed buffer semantics
									intersection.face.materialIndex = group.materialIndex;
									intersects.push( intersection );

								}

							}

						}

					} else {

						const start = Math.max( 0, drawRange.start );
						const end = Math.min( position.count, ( drawRange.start + drawRange.count ) );

						for ( let i = start, il = end; i < il; i += 3 ) {

							const a = i;
							const b = i + 1;
							const c = i + 2;

							intersection = checkBufferGeometryIntersection( this, material, raycaster, _ray$1, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c );

							if ( intersection ) {

								intersection.faceIndex = Math.floor( i / 3 ); // triangle number in non-indexed buffer semantics
								intersects.push( intersection );

							}

						}

					}

				}

			} else if ( geometry.isGeometry ) {

				console.error( 'THREE.Mesh.raycast() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.' );

			}

		}

	}

	Mesh.prototype.isMesh = true;

	function checkIntersection( object, material, raycaster, ray, pA, pB, pC, point ) {

		let intersect;

		if ( material.side === BackSide ) {

			intersect = ray.intersectTriangle( pC, pB, pA, true, point );

		} else {

			intersect = ray.intersectTriangle( pA, pB, pC, material.side !== DoubleSide, point );

		}

		if ( intersect === null ) return null;

		_intersectionPointWorld.copy( point );
		_intersectionPointWorld.applyMatrix4( object.matrixWorld );

		const distance = raycaster.ray.origin.distanceTo( _intersectionPointWorld );

		if ( distance < raycaster.near || distance > raycaster.far ) return null;

		return {
			distance: distance,
			point: _intersectionPointWorld.clone(),
			object: object
		};

	}

	function checkBufferGeometryIntersection( object, material, raycaster, ray, position, morphPosition, morphTargetsRelative, uv, uv2, a, b, c ) {

		_vA.fromBufferAttribute( position, a );
		_vB.fromBufferAttribute( position, b );
		_vC.fromBufferAttribute( position, c );

		const morphInfluences = object.morphTargetInfluences;

		if ( morphPosition && morphInfluences ) {

			_morphA.set( 0, 0, 0 );
			_morphB.set( 0, 0, 0 );
			_morphC.set( 0, 0, 0 );

			for ( let i = 0, il = morphPosition.length; i < il; i ++ ) {

				const influence = morphInfluences[ i ];
				const morphAttribute = morphPosition[ i ];

				if ( influence === 0 ) continue;

				_tempA.fromBufferAttribute( morphAttribute, a );
				_tempB.fromBufferAttribute( morphAttribute, b );
				_tempC.fromBufferAttribute( morphAttribute, c );

				if ( morphTargetsRelative ) {

					_morphA.addScaledVector( _tempA, influence );
					_morphB.addScaledVector( _tempB, influence );
					_morphC.addScaledVector( _tempC, influence );

				} else {

					_morphA.addScaledVector( _tempA.sub( _vA ), influence );
					_morphB.addScaledVector( _tempB.sub( _vB ), influence );
					_morphC.addScaledVector( _tempC.sub( _vC ), influence );

				}

			}

			_vA.add( _morphA );
			_vB.add( _morphB );
			_vC.add( _morphC );

		}

		if ( object.isSkinnedMesh ) {

			object.boneTransform( a, _vA );
			object.boneTransform( b, _vB );
			object.boneTransform( c, _vC );

		}

		const intersection = checkIntersection( object, material, raycaster, ray, _vA, _vB, _vC, _intersectionPoint );

		if ( intersection ) {

			if ( uv ) {

				_uvA.fromBufferAttribute( uv, a );
				_uvB.fromBufferAttribute( uv, b );
				_uvC.fromBufferAttribute( uv, c );

				intersection.uv = Triangle.getUV( _intersectionPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new Vector2() );

			}

			if ( uv2 ) {

				_uvA.fromBufferAttribute( uv2, a );
				_uvB.fromBufferAttribute( uv2, b );
				_uvC.fromBufferAttribute( uv2, c );

				intersection.uv2 = Triangle.getUV( _intersectionPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new Vector2() );

			}

			const face = {
				a: a,
				b: b,
				c: c,
				normal: new Vector3(),
				materialIndex: 0
			};

			Triangle.getNormal( _vA, _vB, _vC, face.normal );

			intersection.face = face;

		}

		return intersection;

	}

	/**
	 * parameters = {
	 *  color: <hex>,
	 *  roughness: <float>,
	 *  metalness: <float>,
	 *  opacity: <float>,
	 *
	 *  map: new THREE.Texture( <Image> ),
	 *
	 *  lightMap: new THREE.Texture( <Image> ),
	 *  lightMapIntensity: <float>
	 *
	 *  aoMap: new THREE.Texture( <Image> ),
	 *  aoMapIntensity: <float>
	 *
	 *  emissive: <hex>,
	 *  emissiveIntensity: <float>
	 *  emissiveMap: new THREE.Texture( <Image> ),
	 *
	 *  bumpMap: new THREE.Texture( <Image> ),
	 *  bumpScale: <float>,
	 *
	 *  normalMap: new THREE.Texture( <Image> ),
	 *  normalMapType: THREE.TangentSpaceNormalMap,
	 *  normalScale: <Vector2>,
	 *
	 *  displacementMap: new THREE.Texture( <Image> ),
	 *  displacementScale: <float>,
	 *  displacementBias: <float>,
	 *
	 *  roughnessMap: new THREE.Texture( <Image> ),
	 *
	 *  metalnessMap: new THREE.Texture( <Image> ),
	 *
	 *  alphaMap: new THREE.Texture( <Image> ),
	 *
	 *  envMap: new THREE.CubeTexture( [posx, negx, posy, negy, posz, negz] ),
	 *  envMapIntensity: <float>
	 *
	 *  refractionRatio: <float>,
	 *
	 *  wireframe: <boolean>,
	 *  wireframeLinewidth: <float>,
	 *
	 *  flatShading: <bool>
	 * }
	 */

	class MeshStandardMaterial extends Material {

		constructor( parameters ) {

			super();

			this.defines = { 'STANDARD': '' };

			this.type = 'MeshStandardMaterial';

			this.color = new Color( 0xffffff ); // diffuse
			this.roughness = 1.0;
			this.metalness = 0.0;

			this.map = null;

			this.lightMap = null;
			this.lightMapIntensity = 1.0;

			this.aoMap = null;
			this.aoMapIntensity = 1.0;

			this.emissive = new Color( 0x000000 );
			this.emissiveIntensity = 1.0;
			this.emissiveMap = null;

			this.bumpMap = null;
			this.bumpScale = 1;

			this.normalMap = null;
			this.normalMapType = TangentSpaceNormalMap;
			this.normalScale = new Vector2( 1, 1 );

			this.displacementMap = null;
			this.displacementScale = 1;
			this.displacementBias = 0;

			this.roughnessMap = null;

			this.metalnessMap = null;

			this.alphaMap = null;

			this.envMap = null;
			this.envMapIntensity = 1.0;

			this.refractionRatio = 0.98;

			this.wireframe = false;
			this.wireframeLinewidth = 1;
			this.wireframeLinecap = 'round';
			this.wireframeLinejoin = 'round';

			this.flatShading = false;

			this.setValues( parameters );

		}

		copy( source ) {

			super.copy( source );

			this.defines = { 'STANDARD': '' };

			this.color.copy( source.color );
			this.roughness = source.roughness;
			this.metalness = source.metalness;

			this.map = source.map;

			this.lightMap = source.lightMap;
			this.lightMapIntensity = source.lightMapIntensity;

			this.aoMap = source.aoMap;
			this.aoMapIntensity = source.aoMapIntensity;

			this.emissive.copy( source.emissive );
			this.emissiveMap = source.emissiveMap;
			this.emissiveIntensity = source.emissiveIntensity;

			this.bumpMap = source.bumpMap;
			this.bumpScale = source.bumpScale;

			this.normalMap = source.normalMap;
			this.normalMapType = source.normalMapType;
			this.normalScale.copy( source.normalScale );

			this.displacementMap = source.displacementMap;
			this.displacementScale = source.displacementScale;
			this.displacementBias = source.displacementBias;

			this.roughnessMap = source.roughnessMap;

			this.metalnessMap = source.metalnessMap;

			this.alphaMap = source.alphaMap;

			this.envMap = source.envMap;
			this.envMapIntensity = source.envMapIntensity;

			this.refractionRatio = source.refractionRatio;

			this.wireframe = source.wireframe;
			this.wireframeLinewidth = source.wireframeLinewidth;
			this.wireframeLinecap = source.wireframeLinecap;
			this.wireframeLinejoin = source.wireframeLinejoin;

			this.flatShading = source.flatShading;

			return this;

		}

	}

	MeshStandardMaterial.prototype.isMeshStandardMaterial = true;

	class Scene extends Object3D {

		constructor() {

			super();

			this.type = 'Scene';

			this.background = null;
			this.environment = null;
			this.fog = null;

			this.overrideMaterial = null;

			this.autoUpdate = true; // checked by the renderer

			if ( typeof __THREE_DEVTOOLS__ !== 'undefined' ) {

				__THREE_DEVTOOLS__.dispatchEvent( new CustomEvent( 'observe', { detail: this } ) ); // eslint-disable-line no-undef

			}

		}

		copy( source, recursive ) {

			super.copy( source, recursive );

			if ( source.background !== null ) this.background = source.background.clone();
			if ( source.environment !== null ) this.environment = source.environment.clone();
			if ( source.fog !== null ) this.fog = source.fog.clone();

			if ( source.overrideMaterial !== null ) this.overrideMaterial = source.overrideMaterial.clone();

			this.autoUpdate = source.autoUpdate;
			this.matrixAutoUpdate = source.matrixAutoUpdate;

			return this;

		}

		toJSON( meta ) {

			const data = super.toJSON( meta );

			if ( this.fog !== null ) data.object.fog = this.fog.toJSON();

			return data;

		}

	}

	Scene.prototype.isScene = true;

	// Characters [].:/ are reserved for track binding syntax.
	const _RESERVED_CHARS_RE = '\\[\\]\\.:\\/';
	const _reservedRe = new RegExp( '[' + _RESERVED_CHARS_RE + ']', 'g' );

	// Attempts to allow node names from any language. ES5's `\w` regexp matches
	// only latin characters, and the unicode \p{L} is not yet supported. So
	// instead, we exclude reserved characters and match everything else.
	const _wordChar = '[^' + _RESERVED_CHARS_RE + ']';
	const _wordCharOrDot = '[^' + _RESERVED_CHARS_RE.replace( '\\.', '' ) + ']';

	// Parent directories, delimited by '/' or ':'. Currently unused, but must
	// be matched to parse the rest of the track name.
	const _directoryRe = /((?:WC+[\/:])*)/.source.replace( 'WC', _wordChar );

	// Target node. May contain word characters (a-zA-Z0-9_) and '.' or '-'.
	const _nodeRe = /(WCOD+)?/.source.replace( 'WCOD', _wordCharOrDot );

	// Object on target node, and accessor. May not contain reserved
	// characters. Accessor may contain any character except closing bracket.
	const _objectRe = /(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace( 'WC', _wordChar );

	// Property and accessor. May not contain reserved characters. Accessor may
	// contain any non-bracket characters.
	const _propertyRe = /\.(WC+)(?:\[(.+)\])?/.source.replace( 'WC', _wordChar );

	const _trackRe = new RegExp( ''
		+ '^'
		+ _directoryRe
		+ _nodeRe
		+ _objectRe
		+ _propertyRe
		+ '$'
	);

	const _supportedObjectNames = [ 'material', 'materials', 'bones' ];

	class Composite {

		constructor( targetGroup, path, optionalParsedPath ) {

			const parsedPath = optionalParsedPath || PropertyBinding.parseTrackName( path );

			this._targetGroup = targetGroup;
			this._bindings = targetGroup.subscribe_( path, parsedPath );

		}

		getValue( array, offset ) {

			this.bind(); // bind all binding

			const firstValidIndex = this._targetGroup.nCachedObjects_,
				binding = this._bindings[ firstValidIndex ];

			// and only call .getValue on the first
			if ( binding !== undefined ) binding.getValue( array, offset );

		}

		setValue( array, offset ) {

			const bindings = this._bindings;

			for ( let i = this._targetGroup.nCachedObjects_, n = bindings.length; i !== n; ++ i ) {

				bindings[ i ].setValue( array, offset );

			}

		}

		bind() {

			const bindings = this._bindings;

			for ( let i = this._targetGroup.nCachedObjects_, n = bindings.length; i !== n; ++ i ) {

				bindings[ i ].bind();

			}

		}

		unbind() {

			const bindings = this._bindings;

			for ( let i = this._targetGroup.nCachedObjects_, n = bindings.length; i !== n; ++ i ) {

				bindings[ i ].unbind();

			}

		}

	}

	// Note: This class uses a State pattern on a per-method basis:
	// 'bind' sets 'this.getValue' / 'setValue' and shadows the
	// prototype version of these methods with one that represents
	// the bound state. When the property is not found, the methods
	// become no-ops.
	class PropertyBinding {

		constructor( rootNode, path, parsedPath ) {

			this.path = path;
			this.parsedPath = parsedPath || PropertyBinding.parseTrackName( path );

			this.node = PropertyBinding.findNode( rootNode, this.parsedPath.nodeName ) || rootNode;

			this.rootNode = rootNode;

			// initial state of these methods that calls 'bind'
			this.getValue = this._getValue_unbound;
			this.setValue = this._setValue_unbound;

		}


		static create( root, path, parsedPath ) {

			if ( ! ( root && root.isAnimationObjectGroup ) ) {

				return new PropertyBinding( root, path, parsedPath );

			} else {

				return new PropertyBinding.Composite( root, path, parsedPath );

			}

		}

		/**
		 * Replaces spaces with underscores and removes unsupported characters from
		 * node names, to ensure compatibility with parseTrackName().
		 *
		 * @param {string} name Node name to be sanitized.
		 * @return {string}
		 */
		static sanitizeNodeName( name ) {

			return name.replace( /\s/g, '_' ).replace( _reservedRe, '' );

		}

		static parseTrackName( trackName ) {

			const matches = _trackRe.exec( trackName );

			if ( ! matches ) {

				throw new Error( 'PropertyBinding: Cannot parse trackName: ' + trackName );

			}

			const results = {
				// directoryName: matches[ 1 ], // (tschw) currently unused
				nodeName: matches[ 2 ],
				objectName: matches[ 3 ],
				objectIndex: matches[ 4 ],
				propertyName: matches[ 5 ], // required
				propertyIndex: matches[ 6 ]
			};

			const lastDot = results.nodeName && results.nodeName.lastIndexOf( '.' );

			if ( lastDot !== undefined && lastDot !== - 1 ) {

				const objectName = results.nodeName.substring( lastDot + 1 );

				// Object names must be checked against an allowlist. Otherwise, there
				// is no way to parse 'foo.bar.baz': 'baz' must be a property, but
				// 'bar' could be the objectName, or part of a nodeName (which can
				// include '.' characters).
				if ( _supportedObjectNames.indexOf( objectName ) !== - 1 ) {

					results.nodeName = results.nodeName.substring( 0, lastDot );
					results.objectName = objectName;

				}

			}

			if ( results.propertyName === null || results.propertyName.length === 0 ) {

				throw new Error( 'PropertyBinding: can not parse propertyName from trackName: ' + trackName );

			}

			return results;

		}

		static findNode( root, nodeName ) {

			if ( ! nodeName || nodeName === '' || nodeName === '.' || nodeName === - 1 || nodeName === root.name || nodeName === root.uuid ) {

				return root;

			}

			// search into skeleton bones.
			if ( root.skeleton ) {

				const bone = root.skeleton.getBoneByName( nodeName );

				if ( bone !== undefined ) {

					return bone;

				}

			}

			// search into node subtree.
			if ( root.children ) {

				const searchNodeSubtree = function ( children ) {

					for ( let i = 0; i < children.length; i ++ ) {

						const childNode = children[ i ];

						if ( childNode.name === nodeName || childNode.uuid === nodeName ) {

							return childNode;

						}

						const result = searchNodeSubtree( childNode.children );

						if ( result ) return result;

					}

					return null;

				};

				const subTreeNode = searchNodeSubtree( root.children );

				if ( subTreeNode ) {

					return subTreeNode;

				}

			}

			return null;

		}

		// these are used to "bind" a nonexistent property
		_getValue_unavailable() {}
		_setValue_unavailable() {}

		// Getters

		_getValue_direct( buffer, offset ) {

			buffer[ offset ] = this.targetObject[ this.propertyName ];

		}

		_getValue_array( buffer, offset ) {

			const source = this.resolvedProperty;

			for ( let i = 0, n = source.length; i !== n; ++ i ) {

				buffer[ offset ++ ] = source[ i ];

			}

		}

		_getValue_arrayElement( buffer, offset ) {

			buffer[ offset ] = this.resolvedProperty[ this.propertyIndex ];

		}

		_getValue_toArray( buffer, offset ) {

			this.resolvedProperty.toArray( buffer, offset );

		}

		// Direct

		_setValue_direct( buffer, offset ) {

			this.targetObject[ this.propertyName ] = buffer[ offset ];

		}

		_setValue_direct_setNeedsUpdate( buffer, offset ) {

			this.targetObject[ this.propertyName ] = buffer[ offset ];
			this.targetObject.needsUpdate = true;

		}

		_setValue_direct_setMatrixWorldNeedsUpdate( buffer, offset ) {

			this.targetObject[ this.propertyName ] = buffer[ offset ];
			this.targetObject.matrixWorldNeedsUpdate = true;

		}

		// EntireArray

		_setValue_array( buffer, offset ) {

			const dest = this.resolvedProperty;

			for ( let i = 0, n = dest.length; i !== n; ++ i ) {

				dest[ i ] = buffer[ offset ++ ];

			}

		}

		_setValue_array_setNeedsUpdate( buffer, offset ) {

			const dest = this.resolvedProperty;

			for ( let i = 0, n = dest.length; i !== n; ++ i ) {

				dest[ i ] = buffer[ offset ++ ];

			}

			this.targetObject.needsUpdate = true;

		}

		_setValue_array_setMatrixWorldNeedsUpdate( buffer, offset ) {

			const dest = this.resolvedProperty;

			for ( let i = 0, n = dest.length; i !== n; ++ i ) {

				dest[ i ] = buffer[ offset ++ ];

			}

			this.targetObject.matrixWorldNeedsUpdate = true;

		}

		// ArrayElement

		_setValue_arrayElement( buffer, offset ) {

			this.resolvedProperty[ this.propertyIndex ] = buffer[ offset ];

		}

		_setValue_arrayElement_setNeedsUpdate( buffer, offset ) {

			this.resolvedProperty[ this.propertyIndex ] = buffer[ offset ];
			this.targetObject.needsUpdate = true;

		}

		_setValue_arrayElement_setMatrixWorldNeedsUpdate( buffer, offset ) {

			this.resolvedProperty[ this.propertyIndex ] = buffer[ offset ];
			this.targetObject.matrixWorldNeedsUpdate = true;

		}

		// HasToFromArray

		_setValue_fromArray( buffer, offset ) {

			this.resolvedProperty.fromArray( buffer, offset );

		}

		_setValue_fromArray_setNeedsUpdate( buffer, offset ) {

			this.resolvedProperty.fromArray( buffer, offset );
			this.targetObject.needsUpdate = true;

		}

		_setValue_fromArray_setMatrixWorldNeedsUpdate( buffer, offset ) {

			this.resolvedProperty.fromArray( buffer, offset );
			this.targetObject.matrixWorldNeedsUpdate = true;

		}

		_getValue_unbound( targetArray, offset ) {

			this.bind();
			this.getValue( targetArray, offset );

		}

		_setValue_unbound( sourceArray, offset ) {

			this.bind();
			this.setValue( sourceArray, offset );

		}

		// create getter / setter pair for a property in the scene graph
		bind() {

			let targetObject = this.node;
			const parsedPath = this.parsedPath;

			const objectName = parsedPath.objectName;
			const propertyName = parsedPath.propertyName;
			let propertyIndex = parsedPath.propertyIndex;

			if ( ! targetObject ) {

				targetObject = PropertyBinding.findNode( this.rootNode, parsedPath.nodeName ) || this.rootNode;

				this.node = targetObject;

			}

			// set fail state so we can just 'return' on error
			this.getValue = this._getValue_unavailable;
			this.setValue = this._setValue_unavailable;

			// ensure there is a value node
			if ( ! targetObject ) {

				console.error( 'THREE.PropertyBinding: Trying to update node for track: ' + this.path + ' but it wasn\'t found.' );
				return;

			}

			if ( objectName ) {

				let objectIndex = parsedPath.objectIndex;

				// special cases were we need to reach deeper into the hierarchy to get the face materials....
				switch ( objectName ) {

					case 'materials':

						if ( ! targetObject.material ) {

							console.error( 'THREE.PropertyBinding: Can not bind to material as node does not have a material.', this );
							return;

						}

						if ( ! targetObject.material.materials ) {

							console.error( 'THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.', this );
							return;

						}

						targetObject = targetObject.material.materials;

						break;

					case 'bones':

						if ( ! targetObject.skeleton ) {

							console.error( 'THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.', this );
							return;

						}

						// potential future optimization: skip this if propertyIndex is already an integer
						// and convert the integer string to a true integer.

						targetObject = targetObject.skeleton.bones;

						// support resolving morphTarget names into indices.
						for ( let i = 0; i < targetObject.length; i ++ ) {

							if ( targetObject[ i ].name === objectIndex ) {

								objectIndex = i;
								break;

							}

						}

						break;

					default:

						if ( targetObject[ objectName ] === undefined ) {

							console.error( 'THREE.PropertyBinding: Can not bind to objectName of node undefined.', this );
							return;

						}

						targetObject = targetObject[ objectName ];

				}


				if ( objectIndex !== undefined ) {

					if ( targetObject[ objectIndex ] === undefined ) {

						console.error( 'THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.', this, targetObject );
						return;

					}

					targetObject = targetObject[ objectIndex ];

				}

			}

			// resolve property
			const nodeProperty = targetObject[ propertyName ];

			if ( nodeProperty === undefined ) {

				const nodeName = parsedPath.nodeName;

				console.error( 'THREE.PropertyBinding: Trying to update property for track: ' + nodeName +
					'.' + propertyName + ' but it wasn\'t found.', targetObject );
				return;

			}

			// determine versioning scheme
			let versioning = this.Versioning.None;

			this.targetObject = targetObject;

			if ( targetObject.needsUpdate !== undefined ) { // material

				versioning = this.Versioning.NeedsUpdate;

			} else if ( targetObject.matrixWorldNeedsUpdate !== undefined ) { // node transform

				versioning = this.Versioning.MatrixWorldNeedsUpdate;

			}

			// determine how the property gets bound
			let bindingType = this.BindingType.Direct;

			if ( propertyIndex !== undefined ) {

				// access a sub element of the property array (only primitives are supported right now)

				if ( propertyName === 'morphTargetInfluences' ) {

					// potential optimization, skip this if propertyIndex is already an integer, and convert the integer string to a true integer.

					// support resolving morphTarget names into indices.
					if ( ! targetObject.geometry ) {

						console.error( 'THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.', this );
						return;

					}

					if ( targetObject.geometry.isBufferGeometry ) {

						if ( ! targetObject.geometry.morphAttributes ) {

							console.error( 'THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.', this );
							return;

						}

						if ( targetObject.morphTargetDictionary[ propertyIndex ] !== undefined ) {

							propertyIndex = targetObject.morphTargetDictionary[ propertyIndex ];

						}


					} else {

						console.error( 'THREE.PropertyBinding: Can not bind to morphTargetInfluences on THREE.Geometry. Use THREE.BufferGeometry instead.', this );
						return;

					}

				}

				bindingType = this.BindingType.ArrayElement;

				this.resolvedProperty = nodeProperty;
				this.propertyIndex = propertyIndex;

			} else if ( nodeProperty.fromArray !== undefined && nodeProperty.toArray !== undefined ) {

				// must use copy for Object3D.Euler/Quaternion

				bindingType = this.BindingType.HasFromToArray;

				this.resolvedProperty = nodeProperty;

			} else if ( Array.isArray( nodeProperty ) ) {

				bindingType = this.BindingType.EntireArray;

				this.resolvedProperty = nodeProperty;

			} else {

				this.propertyName = propertyName;

			}

			// select getter / setter
			this.getValue = this.GetterByBindingType[ bindingType ];
			this.setValue = this.SetterByBindingTypeAndVersioning[ bindingType ][ versioning ];

		}

		unbind() {

			this.node = null;

			// back to the prototype version of getValue / setValue
			// note: avoiding to mutate the shape of 'this' via 'delete'
			this.getValue = this._getValue_unbound;
			this.setValue = this._setValue_unbound;

		}

	}

	PropertyBinding.Composite = Composite;

	PropertyBinding.prototype.BindingType = {
		Direct: 0,
		EntireArray: 1,
		ArrayElement: 2,
		HasFromToArray: 3
	};

	PropertyBinding.prototype.Versioning = {
		None: 0,
		NeedsUpdate: 1,
		MatrixWorldNeedsUpdate: 2
	};

	PropertyBinding.prototype.GetterByBindingType = [

		PropertyBinding.prototype._getValue_direct,
		PropertyBinding.prototype._getValue_array,
		PropertyBinding.prototype._getValue_arrayElement,
		PropertyBinding.prototype._getValue_toArray,

	];

	PropertyBinding.prototype.SetterByBindingTypeAndVersioning = [

		[
			// Direct
			PropertyBinding.prototype._setValue_direct,
			PropertyBinding.prototype._setValue_direct_setNeedsUpdate,
			PropertyBinding.prototype._setValue_direct_setMatrixWorldNeedsUpdate,

		], [

			// EntireArray

			PropertyBinding.prototype._setValue_array,
			PropertyBinding.prototype._setValue_array_setNeedsUpdate,
			PropertyBinding.prototype._setValue_array_setMatrixWorldNeedsUpdate,

		], [

			// ArrayElement
			PropertyBinding.prototype._setValue_arrayElement,
			PropertyBinding.prototype._setValue_arrayElement_setNeedsUpdate,
			PropertyBinding.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate,

		], [

			// HasToFromArray
			PropertyBinding.prototype._setValue_fromArray,
			PropertyBinding.prototype._setValue_fromArray_setNeedsUpdate,
			PropertyBinding.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate,

		]

	];

	/**
	 * @author fernandojsg / http://fernandojsg.com
	 * @author Don McCurdy / https://www.donmccurdy.com
	 * @author Takahiro / https://github.com/takahirox
	 */

	//------------------------------------------------------------------------------
	// Constants
	//------------------------------------------------------------------------------
	var WEBGL_CONSTANTS = {
		POINTS: 0x0000,
		LINES: 0x0001,
		LINE_LOOP: 0x0002,
		LINE_STRIP: 0x0003,
		TRIANGLES: 0x0004,
		TRIANGLE_STRIP: 0x0005,
		TRIANGLE_FAN: 0x0006,

		UNSIGNED_BYTE: 0x1401,
		UNSIGNED_SHORT: 0x1403,
		FLOAT: 0x1406,
		UNSIGNED_INT: 0x1405,
		ARRAY_BUFFER: 0x8892,
		ELEMENT_ARRAY_BUFFER: 0x8893,

		NEAREST: 0x2600,
		LINEAR: 0x2601,
		NEAREST_MIPMAP_NEAREST: 0x2700,
		LINEAR_MIPMAP_NEAREST: 0x2701,
		NEAREST_MIPMAP_LINEAR: 0x2702,
		LINEAR_MIPMAP_LINEAR: 0x2703,

		CLAMP_TO_EDGE: 33071,
		MIRRORED_REPEAT: 33648,
		REPEAT: 10497
	};

	var THREE_TO_WEBGL = {};

	THREE_TO_WEBGL[ NearestFilter ] = WEBGL_CONSTANTS.NEAREST;
	THREE_TO_WEBGL[ NearestMipmapNearestFilter ] = WEBGL_CONSTANTS.NEAREST_MIPMAP_NEAREST;
	THREE_TO_WEBGL[ NearestMipmapLinearFilter ] = WEBGL_CONSTANTS.NEAREST_MIPMAP_LINEAR;
	THREE_TO_WEBGL[ LinearFilter ] = WEBGL_CONSTANTS.LINEAR;
	THREE_TO_WEBGL[ LinearMipmapNearestFilter ] = WEBGL_CONSTANTS.LINEAR_MIPMAP_NEAREST;
	THREE_TO_WEBGL[ LinearMipmapLinearFilter ] = WEBGL_CONSTANTS.LINEAR_MIPMAP_LINEAR;

	THREE_TO_WEBGL[ ClampToEdgeWrapping ] = WEBGL_CONSTANTS.CLAMP_TO_EDGE;
	THREE_TO_WEBGL[ RepeatWrapping ] = WEBGL_CONSTANTS.REPEAT;
	THREE_TO_WEBGL[ MirroredRepeatWrapping ] = WEBGL_CONSTANTS.MIRRORED_REPEAT;

	var PATH_PROPERTIES = {
		scale: 'scale',
		position: 'translation',
		quaternion: 'rotation',
		morphTargetInfluences: 'weights'
	};

	//------------------------------------------------------------------------------
	// GLTF Exporter
	//------------------------------------------------------------------------------
	var GLTFExporter = function () {};

	GLTFExporter.prototype = {

		constructor: GLTFExporter,

		/**
		 * Parse scenes and generate GLTF output
		 * @param  {Scene or [THREE.Scenes]} input   Scene or Array of THREE.Scenes
		 * @param  {Function} onDone  Callback on completed
		 * @param  {Object} options options
		 */
		parse: function ( input, onDone, options ) {

			var DEFAULT_OPTIONS = {
				binary: false,
				trs: false,
				onlyVisible: true,
				truncateDrawRange: true,
				embedImages: true,
				maxTextureSize: Infinity,
				animations: [],
				forcePowerOfTwoTextures: false,
				includeCustomExtensions: false
			};

			options = Object.assign( {}, DEFAULT_OPTIONS, options );

			if ( options.animations.length > 0 ) {

				// Only TRS properties, and not matrices, may be targeted by animation.
				options.trs = true;

			}

			var outputJSON = {

				asset: {

					version: "2.0",
					generator: "GLTFExporter"

				}

			};

			var byteOffset = 0;
			var buffers = [];
			var pending = [];
			var nodeMap = new Map();
			var skins = [];
			var extensionsUsed = {};
			var cachedData = {

				meshes: new Map(),
				attributes: new Map(),
				attributesNormalized: new Map(),
				materials: new Map(),
				textures: new Map(),
				images: new Map()

			};

			var cachedCanvas;

			var uids = new Map();
			var uid = 0;

			/**
			 * Assign and return a temporal unique id for an object
			 * especially which doesn't have .uuid
			 * @param  {Object} object
			 * @return {Integer}
			 */
			function getUID( object ) {

				if ( ! uids.has( object ) ) uids.set( object, uid ++ );

				return uids.get( object );

			}

			/**
			 * Compare two arrays
			 * @param  {Array} array1 Array 1 to compare
			 * @param  {Array} array2 Array 2 to compare
			 * @return {Boolean}        Returns true if both arrays are equal
			 */
			function equalArray( array1, array2 ) {

				return ( array1.length === array2.length ) && array1.every( function ( element, index ) {

					return element === array2[ index ];

				} );

			}

			/**
			 * Converts a string to an ArrayBuffer.
			 * @param  {string} text
			 * @return {ArrayBuffer}
			 */
			function stringToArrayBuffer( text ) {

				if ( TextEncoder !== undefined ) {

					return new TextEncoder().encode( text ).buffer;

				}

				var array = new Uint8Array( new ArrayBuffer( text.length ) );

				for ( var i = 0, il = text.length; i < il; i ++ ) {

					var value = text.charCodeAt( i );

					// Replacing multi-byte character with space(0x20).
					array[ i ] = value > 0xFF ? 0x20 : value;

				}

				return array.buffer;

			}

			/**
			 * Get the min and max vectors from the given attribute
			 * @param  {BufferAttribute} attribute Attribute to find the min/max in range from start to start + count
			 * @param  {Integer} start
			 * @param  {Integer} count
			 * @return {Object} Object containing the `min` and `max` values (As an array of attribute.itemSize components)
			 */
			function getMinMax( attribute, start, count ) {

				var output = {

					min: new Array( attribute.itemSize ).fill( Number.POSITIVE_INFINITY ),
					max: new Array( attribute.itemSize ).fill( Number.NEGATIVE_INFINITY )

				};

				for ( var i = start; i < start + count; i ++ ) {

					for ( var a = 0; a < attribute.itemSize; a ++ ) {

						var value = attribute.array[ i * attribute.itemSize + a ];
						output.min[ a ] = Math.min( output.min[ a ], value );
						output.max[ a ] = Math.max( output.max[ a ], value );

					}

				}

				return output;

			}

			/**
			 * Checks if image size is POT.
			 *
			 * @param {Image} image The image to be checked.
			 * @returns {Boolean} Returns true if image size is POT.
			 *
			 */
			function isPowerOfTwo$1( image ) {

				return isPowerOfTwo( image.width ) && isPowerOfTwo( image.height );

			}

			/**
			 * Checks if normal attribute values are normalized.
			 *
			 * @param {BufferAttribute} normal
			 * @returns {Boolean}
			 *
			 */
			function isNormalizedNormalAttribute( normal ) {

				if ( cachedData.attributesNormalized.has( normal ) ) {

					return false;

				}

				var v = new Vector3();

				for ( var i = 0, il = normal.count; i < il; i ++ ) {

					// 0.0005 is from glTF-validator
					if ( Math.abs( v.fromArray( normal.array, i * 3 ).length() - 1.0 ) > 0.0005 ) return false;

				}

				return true;

			}

			/**
			 * Creates normalized normal buffer attribute.
			 *
			 * @param {BufferAttribute} normal
			 * @returns {BufferAttribute}
			 *
			 */
			function createNormalizedNormalAttribute( normal ) {

				if ( cachedData.attributesNormalized.has( normal ) ) {

					return cachedData.attributesNormalized.get( normal );

				}

				var attribute = normal.clone();

				var v = new Vector3();

				for ( var i = 0, il = attribute.count; i < il; i ++ ) {

					v.fromArray( attribute.array, i * 3 );

					if ( v.x === 0 && v.y === 0 && v.z === 0 ) {

						// if values can't be normalized set (1, 0, 0)
						v.setX( 1.0 );

					} else {

						v.normalize();

					}

					v.toArray( attribute.array, i * 3 );

				}

				cachedData.attributesNormalized.set( normal, attribute );

				return attribute;

			}

			/**
			 * Get the required size + padding for a buffer, rounded to the next 4-byte boundary.
			 * https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#data-alignment
			 *
			 * @param {Integer} bufferSize The size the original buffer.
			 * @returns {Integer} new buffer size with required padding.
			 *
			 */
			function getPaddedBufferSize( bufferSize ) {

				return Math.ceil( bufferSize / 4 ) * 4;

			}

			/**
			 * Returns a buffer aligned to 4-byte boundary.
			 *
			 * @param {ArrayBuffer} arrayBuffer Buffer to pad
			 * @param {Integer} paddingByte (Optional)
			 * @returns {ArrayBuffer} The same buffer if it's already aligned to 4-byte boundary or a new buffer
			 */
			function getPaddedArrayBuffer( arrayBuffer, paddingByte ) {

				paddingByte = paddingByte || 0;

				var paddedLength = getPaddedBufferSize( arrayBuffer.byteLength );

				if ( paddedLength !== arrayBuffer.byteLength ) {

					var array = new Uint8Array( paddedLength );
					array.set( new Uint8Array( arrayBuffer ) );

					if ( paddingByte !== 0 ) {

						for ( var i = arrayBuffer.byteLength; i < paddedLength; i ++ ) {

							array[ i ] = paddingByte;

						}

					}

					return array.buffer;

				}

				return arrayBuffer;

			}

			/**
			 * Serializes a userData.
			 *
			 * @param {THREE.Object3D|THREE.Material} object
			 * @param {Object} gltfProperty
			 */
			function serializeUserData( object, gltfProperty ) {

				if ( Object.keys( object.userData ).length === 0 ) {

					return;

				}

				try {

					var json = JSON.parse( JSON.stringify( object.userData ) );

					if ( options.includeCustomExtensions && json.gltfExtensions ) {

						if ( gltfProperty.extensions === undefined ) {

							gltfProperty.extensions = {};

						}

						for ( var extensionName in json.gltfExtensions ) {

							gltfProperty.extensions[ extensionName ] = json.gltfExtensions[ extensionName ];
							extensionsUsed[ extensionName ] = true;

						}

						delete json.gltfExtensions;

					}

					if ( Object.keys( json ).length > 0 ) {

						gltfProperty.extras = json;

					}

				} catch ( error ) {

					console.warn( 'THREE.GLTFExporter: userData of \'' + object.name + '\' ' +
						'won\'t be serialized because of JSON.stringify error - ' + error.message );

				}

			}

			/**
			 * Applies a texture transform, if present, to the map definition. Requires
			 * the KHR_texture_transform extension.
			 */
			function applyTextureTransform( mapDef, texture ) {

				var didTransform = false;
				var transformDef = {};

				if ( texture.offset.x !== 0 || texture.offset.y !== 0 ) {

					transformDef.offset = texture.offset.toArray();
					didTransform = true;

				}

				if ( texture.rotation !== 0 ) {

					transformDef.rotation = texture.rotation;
					didTransform = true;

				}

				if ( texture.repeat.x !== 1 || texture.repeat.y !== 1 ) {

					transformDef.scale = texture.repeat.toArray();
					didTransform = true;

				}

				if ( didTransform ) {

					mapDef.extensions = mapDef.extensions || {};
					mapDef.extensions[ 'KHR_texture_transform' ] = transformDef;
					extensionsUsed[ 'KHR_texture_transform' ] = true;

				}

			}

			/**
			 * Process a buffer to append to the default one.
			 * @param  {ArrayBuffer} buffer
			 * @return {Integer}
			 */
			function processBuffer( buffer ) {

				if ( ! outputJSON.buffers ) {

					outputJSON.buffers = [ { byteLength: 0 } ];

				}

				// All buffers are merged before export.
				buffers.push( buffer );

				return 0;

			}

			/**
			 * Process and generate a BufferView
			 * @param  {BufferAttribute} attribute
			 * @param  {number} componentType
			 * @param  {number} start
			 * @param  {number} count
			 * @param  {number} target (Optional) Target usage of the BufferView
			 * @return {Object}
			 */
			function processBufferView( attribute, componentType, start, count, target ) {

				if ( ! outputJSON.bufferViews ) {

					outputJSON.bufferViews = [];

				}

				// Create a new dataview and dump the attribute's array into it

				var componentSize;

				if ( componentType === WEBGL_CONSTANTS.UNSIGNED_BYTE ) {

					componentSize = 1;

				} else if ( componentType === WEBGL_CONSTANTS.UNSIGNED_SHORT ) {

					componentSize = 2;

				} else {

					componentSize = 4;

				}

				var byteLength = getPaddedBufferSize( count * attribute.itemSize * componentSize );
				var dataView = new DataView( new ArrayBuffer( byteLength ) );
				var offset = 0;

				for ( var i = start; i < start + count; i ++ ) {

					for ( var a = 0; a < attribute.itemSize; a ++ ) {

						// @TODO Fails on InterleavedBufferAttribute, and could probably be
						// optimized for normal BufferAttribute.
						var value = attribute.array[ i * attribute.itemSize + a ];

						if ( componentType === WEBGL_CONSTANTS.FLOAT ) {

							dataView.setFloat32( offset, value, true );

						} else if ( componentType === WEBGL_CONSTANTS.UNSIGNED_INT ) {

							dataView.setUint32( offset, value, true );

						} else if ( componentType === WEBGL_CONSTANTS.UNSIGNED_SHORT ) {

							dataView.setUint16( offset, value, true );

						} else if ( componentType === WEBGL_CONSTANTS.UNSIGNED_BYTE ) {

							dataView.setUint8( offset, value );

						}

						offset += componentSize;

					}

				}

				var gltfBufferView = {

					buffer: processBuffer( dataView.buffer ),
					byteOffset: byteOffset,
					byteLength: byteLength

				};

				if ( target !== undefined ) gltfBufferView.target = target;

				if ( target === WEBGL_CONSTANTS.ARRAY_BUFFER ) {

					// Only define byteStride for vertex attributes.
					gltfBufferView.byteStride = attribute.itemSize * componentSize;

				}

				byteOffset += byteLength;

				outputJSON.bufferViews.push( gltfBufferView );

				// @TODO Merge bufferViews where possible.
				var output = {

					id: outputJSON.bufferViews.length - 1,
					byteLength: 0

				};

				return output;

			}

			/**
			 * Process and generate a BufferView from an image Blob.
			 * @param {Blob} blob
			 * @return {Promise<Integer>}
			 */
			function processBufferViewImage( blob ) {

				if ( ! outputJSON.bufferViews ) {

					outputJSON.bufferViews = [];

				}

				return new Promise( function ( resolve ) {

					var reader = new FileReader();

					reader.readAsArrayBuffer( blob );
					reader.onloadend = function () {

						var buffer = getPaddedArrayBuffer( reader.result );

						var bufferView = {
							buffer: processBuffer( buffer ),
							byteOffset: byteOffset,
							byteLength: buffer.byteLength
						};

						byteOffset += buffer.byteLength;

						outputJSON.bufferViews.push( bufferView );

						resolve( outputJSON.bufferViews.length - 1 );

					};

				} );

			}

			/**
			 * Process attribute to generate an accessor
			 * @param  {BufferAttribute} attribute Attribute to process
			 * @param  {BufferGeometry} geometry (Optional) Geometry used for truncated draw range
			 * @param  {Integer} start (Optional)
			 * @param  {Integer} count (Optional)
			 * @return {Integer}           Index of the processed accessor on the "accessors" array
			 */
			function processAccessor( attribute, geometry, start, count ) {

				var types = {

					1: 'SCALAR',
					2: 'VEC2',
					3: 'VEC3',
					4: 'VEC4',
					16: 'MAT4'

				};

				var componentType;

				// Detect the component type of the attribute array (float, uint or ushort)
				if ( attribute.array.constructor === Float32Array ) {

					componentType = WEBGL_CONSTANTS.FLOAT;

				} else if ( attribute.array.constructor === Uint32Array ) {

					componentType = WEBGL_CONSTANTS.UNSIGNED_INT;

				} else if ( attribute.array.constructor === Uint16Array ) {

					componentType = WEBGL_CONSTANTS.UNSIGNED_SHORT;

				} else if ( attribute.array.constructor === Uint8Array ) {

					componentType = WEBGL_CONSTANTS.UNSIGNED_BYTE;

				} else {

					throw new Error( 'THREE.GLTFExporter: Unsupported bufferAttribute component type.' );

				}

				if ( start === undefined ) start = 0;
				if ( count === undefined ) count = attribute.count;

				// @TODO Indexed buffer geometry with drawRange not supported yet
				if ( options.truncateDrawRange && geometry !== undefined && geometry.index === null ) {

					var end = start + count;
					var end2 = geometry.drawRange.count === Infinity
						? attribute.count
						: geometry.drawRange.start + geometry.drawRange.count;

					start = Math.max( start, geometry.drawRange.start );
					count = Math.min( end, end2 ) - start;

					if ( count < 0 ) count = 0;

				}

				// Skip creating an accessor if the attribute doesn't have data to export
				if ( count === 0 ) {

					return null;

				}

				var minMax = getMinMax( attribute, start, count );

				var bufferViewTarget;

				// If geometry isn't provided, don't infer the target usage of the bufferView. For
				// animation samplers, target must not be set.
				if ( geometry !== undefined ) {

					bufferViewTarget = attribute === geometry.index ? WEBGL_CONSTANTS.ELEMENT_ARRAY_BUFFER : WEBGL_CONSTANTS.ARRAY_BUFFER;

				}

				var bufferView = processBufferView( attribute, componentType, start, count, bufferViewTarget );

				var gltfAccessor = {

					bufferView: bufferView.id,
					byteOffset: bufferView.byteOffset,
					componentType: componentType,
					count: count,
					max: minMax.max,
					min: minMax.min,
					type: types[ attribute.itemSize ]

				};

				if ( attribute.normalized === true ) {

					gltfAccessor.normalized = true;

				}

				if ( ! outputJSON.accessors ) {

					outputJSON.accessors = [];

				}

				outputJSON.accessors.push( gltfAccessor );

				return outputJSON.accessors.length - 1;

			}

			/**
			 * Process image
			 * @param  {Image} image to process
			 * @param  {Integer} format of the image (e.g. THREE.RGBFormat, RGBAFormat etc)
			 * @param  {Boolean} flipY before writing out the image
			 * @return {Integer}     Index of the processed texture in the "images" array
			 */
			function processImage( image, format, flipY ) {

				if ( ! cachedData.images.has( image ) ) {

					cachedData.images.set( image, {} );

				}

				var cachedImages = cachedData.images.get( image );
				var mimeType = format === RGBAFormat ? 'image/png' : 'image/jpeg';
				var key = mimeType + ':flipY/' + flipY.toString();

				if ( cachedImages[ key ] !== undefined ) {

					return cachedImages[ key ];

				}

				if ( ! outputJSON.images ) {

					outputJSON.images = [];

				}

				var gltfImage = { mimeType: mimeType };

				if ( options.embedImages ) {

					if ( typeof image === 'string' && image.substring( 0, 10 ) === 'data:image' ) {

						if ( options.binary === true ) {

							var b = atob( image.split( ',' )[ 1 ] );
							var blob = new Blob( [ b ], { type: mimeType } );

							pending.push(

								processBufferViewImage( blob ).then( function ( bufferViewIndex ) {

									gltfImage.bufferView = bufferViewIndex;

								} )

							);

						} else {

							gltfImage.uri = image;

						}

					} else {

						var canvas = cachedCanvas = cachedCanvas || document.createElement( 'canvas' );

						canvas.width = Math.min( image.width, options.maxTextureSize );
						canvas.height = Math.min( image.height, options.maxTextureSize );

						if ( options.forcePowerOfTwoTextures && ! isPowerOfTwo$1( canvas ) ) {

							console.warn( 'GLTFExporter: Resized non-power-of-two image.', image );

							canvas.width = floorPowerOfTwo( canvas.width );
							canvas.height = floorPowerOfTwo( canvas.height );

						}

						var ctx = canvas.getContext( '2d' );

						if ( flipY === true ) {

							ctx.translate( 0, canvas.height );
							ctx.scale( 1, - 1 );

							if ( options.binary === true ) {

								pending.push( new Promise( function ( resolve ) {

									canvas.toBlob( function ( blob ) {

										processBufferViewImage( blob ).then( function ( bufferViewIndex ) {

											gltfImage.bufferView = bufferViewIndex;

											resolve();

										} );

									}, mimeType );

								} ) );

							} else {

								gltfImage.uri = canvas.toDataURL( mimeType );

							}

						}

						ctx.drawImage( image, 0, 0, canvas.width, canvas.height );

						if ( options.binary === true ) {

							pending.push( new Promise( function ( resolve ) {

								canvas.toBlob( function ( blob ) {

									processBufferViewImage( blob ).then( function ( bufferViewIndex ) {

										gltfImage.bufferView = bufferViewIndex;

										resolve();

									} );

								}, mimeType );

							} ) );

						} else {

							gltfImage.uri = canvas.toDataURL( mimeType );

						}

					}

				} else {

					gltfImage.uri = image.src;

				}

				outputJSON.images.push( gltfImage );

				var index = outputJSON.images.length - 1;
				cachedImages[ key ] = index;

				return index;

			}

			/**
			 * Process sampler
			 * @param  {Texture} map Texture to process
			 * @return {Integer}     Index of the processed texture in the "samplers" array
			 */
			function processSampler( map ) {

				if ( ! outputJSON.samplers ) {

					outputJSON.samplers = [];

				}

				var gltfSampler = {

					magFilter: THREE_TO_WEBGL[ map.magFilter ],
					minFilter: THREE_TO_WEBGL[ map.minFilter ],
					wrapS: THREE_TO_WEBGL[ map.wrapS ],
					wrapT: THREE_TO_WEBGL[ map.wrapT ]

				};

				outputJSON.samplers.push( gltfSampler );

				return outputJSON.samplers.length - 1;

			}

			/**
			 * Process texture
			 * @param  {Texture} map Map to process
			 * @return {Integer}     Index of the processed texture in the "textures" array
			 */
			function processTexture( map ) {

				if ( cachedData.textures.has( map ) ) {

					return cachedData.textures.get( map );

				}

				if ( ! outputJSON.textures ) {

					outputJSON.textures = [];

				}

				var gltfTexture = {

					sampler: processSampler( map ),
					source: processImage( map.image, map.format, map.flipY )

				};

				if ( map.name ) {

					gltfTexture.name = map.name;

				}

				outputJSON.textures.push( gltfTexture );

				var index = outputJSON.textures.length - 1;
				cachedData.textures.set( map, index );

				return index;

			}

			/**
			 * Process material
			 * @param  {THREE.Material} material Material to process
			 * @return {Integer}      Index of the processed material in the "materials" array
			 */
			function processMaterial( material ) {

				if ( cachedData.materials.has( material ) ) {

					return cachedData.materials.get( material );

				}

				if ( material.isShaderMaterial ) {

					console.warn( 'GLTFExporter: THREE.ShaderMaterial not supported.' );
					return null;

				}

				if ( ! outputJSON.materials ) {

					outputJSON.materials = [];

				}

				// @QUESTION Should we avoid including any attribute that has the default value?
				var gltfMaterial = {

					pbrMetallicRoughness: {}

				};

				if ( material.isMeshBasicMaterial ) {

					gltfMaterial.extensions = { KHR_materials_unlit: {} };

					extensionsUsed[ 'KHR_materials_unlit' ] = true;

				} else if ( material.isGLTFSpecularGlossinessMaterial ) {

					gltfMaterial.extensions = { KHR_materials_pbrSpecularGlossiness: {} };

					extensionsUsed[ 'KHR_materials_pbrSpecularGlossiness' ] = true;

				} else if ( ! material.isMeshStandardMaterial ) {

					console.warn( 'GLTFExporter: Use MeshStandardMaterial or MeshBasicMaterial for best results.' );

				}

				// pbrMetallicRoughness.baseColorFactor
				var color = material.color.toArray().concat( [ material.opacity ] );

				if ( ! equalArray( color, [ 1, 1, 1, 1 ] ) ) {

					gltfMaterial.pbrMetallicRoughness.baseColorFactor = color;

				}

				if ( material.isMeshStandardMaterial ) {

					gltfMaterial.pbrMetallicRoughness.metallicFactor = material.metalness;
					gltfMaterial.pbrMetallicRoughness.roughnessFactor = material.roughness;

				} else if ( material.isMeshBasicMaterial ) {

					gltfMaterial.pbrMetallicRoughness.metallicFactor = 0.0;
					gltfMaterial.pbrMetallicRoughness.roughnessFactor = 0.9;

				} else {

					gltfMaterial.pbrMetallicRoughness.metallicFactor = 0.5;
					gltfMaterial.pbrMetallicRoughness.roughnessFactor = 0.5;

				}

				// pbrSpecularGlossiness diffuse, specular and glossiness factor
				if ( material.isGLTFSpecularGlossinessMaterial ) {

					if ( gltfMaterial.pbrMetallicRoughness.baseColorFactor ) {

						gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness.diffuseFactor = gltfMaterial.pbrMetallicRoughness.baseColorFactor;

					}

					var specularFactor = [ 1, 1, 1 ];
					material.specular.toArray( specularFactor, 0 );
					gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor = specularFactor;

					gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness.glossinessFactor = material.glossiness;

				}

				// pbrMetallicRoughness.metallicRoughnessTexture
				if ( material.metalnessMap || material.roughnessMap ) {

					if ( material.metalnessMap === material.roughnessMap ) {

						var metalRoughMapDef = { index: processTexture( material.metalnessMap ) };
						applyTextureTransform( metalRoughMapDef, material.metalnessMap );
						gltfMaterial.pbrMetallicRoughness.metallicRoughnessTexture = metalRoughMapDef;

					} else {

						console.warn( 'THREE.GLTFExporter: Ignoring metalnessMap and roughnessMap because they are not the same Texture.' );

					}

				}

				// pbrMetallicRoughness.baseColorTexture or pbrSpecularGlossiness diffuseTexture
				if ( material.map ) {

					var baseColorMapDef = { index: processTexture( material.map ) };
					applyTextureTransform( baseColorMapDef, material.map );

					if ( material.isGLTFSpecularGlossinessMaterial ) {

						gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness.diffuseTexture = baseColorMapDef;

					}

					gltfMaterial.pbrMetallicRoughness.baseColorTexture = baseColorMapDef;

				}

				// pbrSpecularGlossiness specular map
				if ( material.isGLTFSpecularGlossinessMaterial && material.specularMap ) {

					var specularMapDef = { index: processTexture( material.specularMap ) };
					applyTextureTransform( specularMapDef, material.specularMap );
					gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture = specularMapDef;

				}

				if ( material.emissive ) {

					// emissiveFactor
					var emissive = material.emissive.clone().multiplyScalar( material.emissiveIntensity ).toArray();

					if ( ! equalArray( emissive, [ 0, 0, 0 ] ) ) {

						gltfMaterial.emissiveFactor = emissive;

					}

					// emissiveTexture
					if ( material.emissiveMap ) {

						var emissiveMapDef = { index: processTexture( material.emissiveMap ) };
						applyTextureTransform( emissiveMapDef, material.emissiveMap );
						gltfMaterial.emissiveTexture = emissiveMapDef;

					}

				}

				// normalTexture
				if ( material.normalMap ) {

					var normalMapDef = { index: processTexture( material.normalMap ) };

					if ( material.normalScale && material.normalScale.x !== - 1 ) {

						if ( material.normalScale.x !== material.normalScale.y ) {

							console.warn( 'THREE.GLTFExporter: Normal scale components are different, ignoring Y and exporting X.' );

						}

						normalMapDef.scale = material.normalScale.x;

					}

					applyTextureTransform( normalMapDef, material.normalMap );

					gltfMaterial.normalTexture = normalMapDef;

				}

				// occlusionTexture
				if ( material.aoMap ) {

					var occlusionMapDef = {
						index: processTexture( material.aoMap ),
						texCoord: 1
					};

					if ( material.aoMapIntensity !== 1.0 ) {

						occlusionMapDef.strength = material.aoMapIntensity;

					}

					applyTextureTransform( occlusionMapDef, material.aoMap );

					gltfMaterial.occlusionTexture = occlusionMapDef;

				}

				// alphaMode
				if ( material.transparent ) {

					gltfMaterial.alphaMode = 'BLEND';

				} else {

					if ( material.alphaTest > 0.0 ) {

						gltfMaterial.alphaMode = 'MASK';
						gltfMaterial.alphaCutoff = material.alphaTest;

					}

				}

				// doubleSided
				if ( material.side === DoubleSide ) {

					gltfMaterial.doubleSided = true;

				}

				if ( material.name !== '' ) {

					gltfMaterial.name = material.name;

				}

				serializeUserData( material, gltfMaterial );

				outputJSON.materials.push( gltfMaterial );

				var index = outputJSON.materials.length - 1;
				cachedData.materials.set( material, index );

				return index;

			}

			/**
			 * Process mesh
			 * @param  {THREE.Mesh} mesh Mesh to process
			 * @return {Integer}      Index of the processed mesh in the "meshes" array
			 */
			function processMesh( mesh ) {

				var meshCacheKeyParts = [ mesh.geometry.uuid ];
				if ( Array.isArray( mesh.material ) ) {

					for ( var i = 0, l = mesh.material.length; i < l; i ++ ) {

						meshCacheKeyParts.push( mesh.material[ i ].uuid	);

					}

				} else {

					meshCacheKeyParts.push( mesh.material.uuid );

				}

				var meshCacheKey = meshCacheKeyParts.join( ':' );
				if ( cachedData.meshes.has( meshCacheKey ) ) {

					return cachedData.meshes.get( meshCacheKey );

				}

				var geometry = mesh.geometry;

				var mode;

				// Use the correct mode
				if ( mesh.isLineSegments ) {

					mode = WEBGL_CONSTANTS.LINES;

				} else if ( mesh.isLineLoop ) {

					mode = WEBGL_CONSTANTS.LINE_LOOP;

				} else if ( mesh.isLine ) {

					mode = WEBGL_CONSTANTS.LINE_STRIP;

				} else if ( mesh.isPoints ) {

					mode = WEBGL_CONSTANTS.POINTS;

				} else {

					mode = mesh.material.wireframe ? WEBGL_CONSTANTS.LINES : WEBGL_CONSTANTS.TRIANGLES;

				}

				if ( ! geometry.isBufferGeometry ) {

					console.warn( 'GLTFExporter: Exporting THREE.Geometry will increase file size. Use BufferGeometry instead.' );
					geometry = new BufferGeometry().setFromObject( mesh );

				}

				var gltfMesh = {};

				var attributes = {};
				var primitives = [];
				var targets = [];

				// Conversion between attributes names in threejs and gltf spec
				var nameConversion = {

					uv: 'TEXCOORD_0',
					uv2: 'TEXCOORD_1',
					color: 'COLOR_0',
					skinWeight: 'WEIGHTS_0',
					skinIndex: 'JOINTS_0'

				};

				var originalNormal = geometry.getAttribute( 'normal' );

				if ( originalNormal !== undefined && ! isNormalizedNormalAttribute( originalNormal ) ) {

					console.warn( 'THREE.GLTFExporter: Creating normalized normal attribute from the non-normalized one.' );

					geometry.setAttribute( 'normal', createNormalizedNormalAttribute( originalNormal ) );

				}

				// @QUESTION Detect if .vertexColors = true?
				// For every attribute create an accessor
				var modifiedAttribute = null;
				for ( var attributeName in geometry.attributes ) {

					// Ignore morph target attributes, which are exported later.
					if ( attributeName.substr( 0, 5 ) === 'morph' ) continue;

					var attribute = geometry.attributes[ attributeName ];
					attributeName = nameConversion[ attributeName ] || attributeName.toUpperCase();

					// Prefix all geometry attributes except the ones specifically
					// listed in the spec; non-spec attributes are considered custom.
					var validVertexAttributes =
							/^(POSITION|NORMAL|TANGENT|TEXCOORD_\d+|COLOR_\d+|JOINTS_\d+|WEIGHTS_\d+)$/;
					if ( ! validVertexAttributes.test( attributeName ) ) {

						attributeName = '_' + attributeName;

					}

					if ( cachedData.attributes.has( getUID( attribute ) ) ) {

						attributes[ attributeName ] = cachedData.attributes.get( getUID( attribute ) );
						continue;

					}

					// JOINTS_0 must be UNSIGNED_BYTE or UNSIGNED_SHORT.
					modifiedAttribute = null;
					var array = attribute.array;
					if ( attributeName === 'JOINTS_0' &&
						! ( array instanceof Uint16Array ) &&
						! ( array instanceof Uint8Array ) ) {

						console.warn( 'GLTFExporter: Attribute "skinIndex" converted to type UNSIGNED_SHORT.' );
						modifiedAttribute = new BufferAttribute( new Uint16Array( array ), attribute.itemSize, attribute.normalized );

					}

					var accessor = processAccessor( modifiedAttribute || attribute, geometry );
					if ( accessor !== null ) {

						attributes[ attributeName ] = accessor;
						cachedData.attributes.set( getUID( attribute ), accessor );

					}

				}

				if ( originalNormal !== undefined ) geometry.setAttribute( 'normal', originalNormal );

				// Skip if no exportable attributes found
				if ( Object.keys( attributes ).length === 0 ) {

					return null;

				}

				// Morph targets
				if ( mesh.morphTargetInfluences !== undefined && mesh.morphTargetInfluences.length > 0 ) {

					var weights = [];
					var targetNames = [];
					var reverseDictionary = {};

					if ( mesh.morphTargetDictionary !== undefined ) {

						for ( var key in mesh.morphTargetDictionary ) {

							reverseDictionary[ mesh.morphTargetDictionary[ key ] ] = key;

						}

					}

					for ( i = 0; i < mesh.morphTargetInfluences.length; ++ i ) {

						var target = {};

						var warned = false;

						for ( attributeName in geometry.morphAttributes ) {

							// glTF 2.0 morph supports only POSITION/NORMAL/TANGENT.
							// Three.js doesn't support TANGENT yet.

							if ( attributeName !== 'position' && attributeName !== 'normal' ) {

								if ( ! warned ) {

									console.warn( 'GLTFExporter: Only POSITION and NORMAL morph are supported.' );
									warned = true;

								}

								continue;

							}

							const attribute = geometry.morphAttributes[ attributeName ][ i ];
							var gltfAttributeName = attributeName.toUpperCase();

							// Three.js morph attribute has absolute values while the one of glTF has relative values.
							//
							// glTF 2.0 Specification:
							// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#morph-targets

							var baseAttribute = geometry.attributes[ attributeName ];

							if ( cachedData.attributes.has( getUID( attribute ) ) ) {

								target[ gltfAttributeName ] = cachedData.attributes.get( getUID( attribute ) );
								continue;

							}

							// Clones attribute not to override
							var relativeAttribute = attribute.clone();

							if ( ! geometry.morphTargetsRelative ) {

								for ( var j = 0, jl = attribute.count; j < jl; j ++ ) {

									relativeAttribute.setXYZ(
										j,
										attribute.getX( j ) - baseAttribute.getX( j ),
										attribute.getY( j ) - baseAttribute.getY( j ),
										attribute.getZ( j ) - baseAttribute.getZ( j )
									);

								}

							}

							target[ gltfAttributeName ] = processAccessor( relativeAttribute, geometry );
							cachedData.attributes.set( getUID( baseAttribute ), target[ gltfAttributeName ] );

						}

						targets.push( target );

						weights.push( mesh.morphTargetInfluences[ i ] );
						if ( mesh.morphTargetDictionary !== undefined ) targetNames.push( reverseDictionary[ i ] );

					}

					gltfMesh.weights = weights;

					if ( targetNames.length > 0 ) {

						gltfMesh.extras = {};
						gltfMesh.extras.targetNames = targetNames;

					}

				}

				var isMultiMaterial = Array.isArray( mesh.material );

				if ( isMultiMaterial && geometry.groups.length === 0 ) return null;

				var materials = isMultiMaterial ? mesh.material : [ mesh.material ];
				var groups = isMultiMaterial ? geometry.groups : [ { materialIndex: 0, start: undefined, count: undefined } ];

				const il = groups.length;

				for ( i = 0; i < il; i ++ ) {

					var primitive = {
						mode: mode,
						attributes: attributes,
					};

					serializeUserData( geometry, primitive );

					if ( targets.length > 0 ) primitive.targets = targets;

					if ( geometry.index !== null ) {

						var cacheKey = getUID( geometry.index );

						if ( groups[ i ].start !== undefined || groups[ i ].count !== undefined ) {

							cacheKey += ':' + groups[ i ].start + ':' + groups[ i ].count;

						}

						if ( cachedData.attributes.has( cacheKey ) ) {

							primitive.indices = cachedData.attributes.get( cacheKey );

						} else {

							primitive.indices = processAccessor( geometry.index, geometry, groups[ i ].start, groups[ i ].count );
							cachedData.attributes.set( cacheKey, primitive.indices );

						}

						if ( primitive.indices === null ) delete primitive.indices;

					}

					var material = processMaterial( materials[ groups[ i ].materialIndex ] );

					if ( material !== null ) {

						primitive.material = material;

					}

					primitives.push( primitive );

				}

				gltfMesh.primitives = primitives;

				if ( ! outputJSON.meshes ) {

					outputJSON.meshes = [];

				}

				outputJSON.meshes.push( gltfMesh );

				var index = outputJSON.meshes.length - 1;
				cachedData.meshes.set( meshCacheKey, index );

				return index;

			}

			/**
			 * Process camera
			 * @param  {THREE.Camera} camera Camera to process
			 * @return {Integer}      Index of the processed mesh in the "camera" array
			 */
			function processCamera( camera ) {

				if ( ! outputJSON.cameras ) {

					outputJSON.cameras = [];

				}

				var isOrtho = camera.isOrthographicCamera;

				var gltfCamera = {

					type: isOrtho ? 'orthographic' : 'perspective'

				};

				if ( isOrtho ) {

					gltfCamera.orthographic = {

						xmag: camera.right * 2,
						ymag: camera.top * 2,
						zfar: camera.far <= 0 ? 0.001 : camera.far,
						znear: camera.near < 0 ? 0 : camera.near

					};

				} else {

					gltfCamera.perspective = {

						aspectRatio: camera.aspect,
						yfov: degToRad( camera.fov ),
						zfar: camera.far <= 0 ? 0.001 : camera.far,
						znear: camera.near < 0 ? 0 : camera.near

					};

				}

				if ( camera.name !== '' ) {

					gltfCamera.name = camera.type;

				}

				outputJSON.cameras.push( gltfCamera );

				return outputJSON.cameras.length - 1;

			}

			/**
			 * Creates glTF animation entry from AnimationClip object.
			 *
			 * Status:
			 * - Only properties listed in PATH_PROPERTIES may be animated.
			 *
			 * @param {THREE.AnimationClip} clip
			 * @param {THREE.Object3D} root
			 * @return {number}
			 */
			function processAnimation( clip, root ) {

				if ( ! outputJSON.animations ) {

					outputJSON.animations = [];

				}

				clip = GLTFExporter.Utils.mergeMorphTargetTracks( clip.clone(), root );

				var tracks = clip.tracks;
				var channels = [];
				var samplers = [];

				for ( var i = 0; i < tracks.length; ++ i ) {

					var track = tracks[ i ];
					var trackBinding = PropertyBinding.parseTrackName( track.name );
					var trackNode = PropertyBinding.findNode( root, trackBinding.nodeName );
					var trackProperty = PATH_PROPERTIES[ trackBinding.propertyName ];

					if ( trackBinding.objectName === 'bones' ) {

						if ( trackNode.isSkinnedMesh === true ) {

							trackNode = trackNode.skeleton.getBoneByName( trackBinding.objectIndex );

						} else {

							trackNode = undefined;

						}

					}

					if ( ! trackNode || ! trackProperty ) {

						console.warn( 'THREE.GLTFExporter: Could not export animation track "%s".', track.name );
						return null;

					}

					var inputItemSize = 1;
					var outputItemSize = track.values.length / track.times.length;

					if ( trackProperty === PATH_PROPERTIES.morphTargetInfluences ) {

						outputItemSize /= trackNode.morphTargetInfluences.length;

					}

					var interpolation;

					// @TODO export CubicInterpolant(InterpolateSmooth) as CUBICSPLINE

					// Detecting glTF cubic spline interpolant by checking factory method's special property
					// GLTFCubicSplineInterpolant is a custom interpolant and track doesn't return
					// valid value from .getInterpolation().
					if ( track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline === true ) {

						interpolation = 'CUBICSPLINE';

						// itemSize of CUBICSPLINE keyframe is 9
						// (VEC3 * 3: inTangent, splineVertex, and outTangent)
						// but needs to be stored as VEC3 so dividing by 3 here.
						outputItemSize /= 3;

					} else if ( track.getInterpolation() === InterpolateDiscrete ) {

						interpolation = 'STEP';

					} else {

						interpolation = 'LINEAR';

					}

					samplers.push( {

						input: processAccessor( new BufferAttribute( track.times, inputItemSize ) ),
						output: processAccessor( new BufferAttribute( track.values, outputItemSize ) ),
						interpolation: interpolation

					} );

					channels.push( {

						sampler: samplers.length - 1,
						target: {
							node: nodeMap.get( trackNode ),
							path: trackProperty
						}

					} );

				}

				outputJSON.animations.push( {

					name: clip.name || 'clip_' + outputJSON.animations.length,
					samplers: samplers,
					channels: channels

				} );

				return outputJSON.animations.length - 1;

			}

			function processSkin( object ) {

				var node = outputJSON.nodes[ nodeMap.get( object ) ];

				var skeleton = object.skeleton;

				if ( skeleton === undefined ) return null;

				var rootJoint = object.skeleton.bones[ 0 ];

				if ( rootJoint === undefined ) return null;

				var joints = [];
				var inverseBindMatrices = new Float32Array( skeleton.bones.length * 16 );

				for ( var i = 0; i < skeleton.bones.length; ++ i ) {

					joints.push( nodeMap.get( skeleton.bones[ i ] ) );

					skeleton.boneInverses[ i ].toArray( inverseBindMatrices, i * 16 );

				}

				if ( outputJSON.skins === undefined ) {

					outputJSON.skins = [];

				}

				outputJSON.skins.push( {

					inverseBindMatrices: processAccessor( new BufferAttribute( inverseBindMatrices, 16 ) ),
					joints: joints,
					skeleton: nodeMap.get( rootJoint )

				} );

				var skinIndex = node.skin = outputJSON.skins.length - 1;

				return skinIndex;

			}

			function processLight( light ) {

				var lightDef = {};

				if ( light.name ) lightDef.name = light.name;

				lightDef.color = light.color.toArray();

				lightDef.intensity = light.intensity;

				if ( light.isDirectionalLight ) {

					lightDef.type = 'directional';

				} else if ( light.isPointLight ) {

					lightDef.type = 'point';
					if ( light.distance > 0 ) lightDef.range = light.distance;

				} else if ( light.isSpotLight ) {

					lightDef.type = 'spot';
					if ( light.distance > 0 ) lightDef.range = light.distance;
					lightDef.spot = {};
					lightDef.spot.innerConeAngle = ( light.penumbra - 1.0 ) * light.angle * - 1.0;
					lightDef.spot.outerConeAngle = light.angle;

				}

				if ( light.decay !== undefined && light.decay !== 2 ) {

					console.warn( 'THREE.GLTFExporter: Light decay may be lost. glTF is physically-based, '
						+ 'and expects light.decay=2.' );

				}

				if ( light.target
						&& ( light.target.parent !== light
							|| light.target.position.x !== 0
							|| light.target.position.y !== 0
							|| light.target.position.z !== - 1 ) ) {

					console.warn( 'THREE.GLTFExporter: Light direction may be lost. For best results, '
						+ 'make light.target a child of the light with position 0,0,-1.' );

				}

				var lights = outputJSON.extensions[ 'KHR_lights_punctual' ].lights;
				lights.push( lightDef );
				return lights.length - 1;

			}

			/**
			 * Process Object3D node
			 * @param  {THREE.Object3D} node Object3D to processNode
			 * @return {Integer}      Index of the node in the nodes list
			 */
			function processNode( object ) {

				if ( ! outputJSON.nodes ) {

					outputJSON.nodes = [];

				}

				var gltfNode = {};

				if ( options.trs ) {

					var rotation = object.quaternion.toArray();
					var position = object.position.toArray();
					var scale = object.scale.toArray();

					if ( ! equalArray( rotation, [ 0, 0, 0, 1 ] ) ) {

						gltfNode.rotation = rotation;

					}

					if ( ! equalArray( position, [ 0, 0, 0 ] ) ) {

						gltfNode.translation = position;

					}

					if ( ! equalArray( scale, [ 1, 1, 1 ] ) ) {

						gltfNode.scale = scale;

					}

				} else {

					if ( object.matrixAutoUpdate ) {

						object.updateMatrix();

					}

					if ( ! equalArray( object.matrix.elements, [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ] ) ) {

						gltfNode.matrix = object.matrix.elements;

					}

				}

				// We don't export empty strings name because it represents no-name in Three.js.
				if ( object.name !== '' ) {

					gltfNode.name = String( object.name );

				}

				serializeUserData( object, gltfNode );

				if ( object.isMesh || object.isLine || object.isPoints ) {

					var mesh = processMesh( object );

					if ( mesh !== null ) {

						gltfNode.mesh = mesh;

					}

				} else if ( object.isCamera ) {

					gltfNode.camera = processCamera( object );

				} else if ( object.isDirectionalLight || object.isPointLight || object.isSpotLight ) {

					if ( ! extensionsUsed[ 'KHR_lights_punctual' ] ) {

						outputJSON.extensions = outputJSON.extensions || {};
						outputJSON.extensions[ 'KHR_lights_punctual' ] = { lights: [] };
						extensionsUsed[ 'KHR_lights_punctual' ] = true;

					}

					gltfNode.extensions = gltfNode.extensions || {};
					gltfNode.extensions[ 'KHR_lights_punctual' ] = { light: processLight( object ) };

				} else if ( object.isLight ) {

					console.warn( 'THREE.GLTFExporter: Only directional, point, and spot lights are supported.', object );
					return null;

				}

				if ( object.isSkinnedMesh ) {

					skins.push( object );

				}

				if ( object.children.length > 0 ) {

					var children = [];

					for ( var i = 0, l = object.children.length; i < l; i ++ ) {

						var child = object.children[ i ];

						if ( child.visible || options.onlyVisible === false ) {

							var node = processNode( child );

							if ( node !== null ) {

								children.push( node );

							}

						}

					}

					if ( children.length > 0 ) {

						gltfNode.children = children;

					}


				}

				outputJSON.nodes.push( gltfNode );

				var nodeIndex = outputJSON.nodes.length - 1;
				nodeMap.set( object, nodeIndex );

				return nodeIndex;

			}

			/**
			 * Process Scene
			 * @param  {Scene} node Scene to process
			 */
			function processScene( scene ) {

				if ( ! outputJSON.scenes ) {

					outputJSON.scenes = [];
					outputJSON.scene = 0;

				}

				var gltfScene = {};

				if ( scene.name !== '' ) {

					gltfScene.name = scene.name;

				}

				outputJSON.scenes.push( gltfScene );

				var nodes = [];

				for ( var i = 0, l = scene.children.length; i < l; i ++ ) {

					var child = scene.children[ i ];

					if ( child.visible || options.onlyVisible === false ) {

						var node = processNode( child );

						if ( node !== null ) {

							nodes.push( node );

						}

					}

				}

				if ( nodes.length > 0 ) {

					gltfScene.nodes = nodes;

				}

				serializeUserData( scene, gltfScene );

			}

			/**
			 * Creates a Scene to hold a list of objects and parse it
			 * @param  {Array} objects List of objects to process
			 */
			function processObjects( objects ) {

				var scene = new Scene();
				scene.name = 'AuxScene';

				for ( var i = 0; i < objects.length; i ++ ) {

					// We push directly to children instead of calling `add` to prevent
					// modify the .parent and break its original scene and hierarchy
					scene.children.push( objects[ i ] );

				}

				processScene( scene );

			}

			function processInput( input ) {

				input = input instanceof Array ? input : [ input ];

				var objectsWithoutScene = [];

				for ( var i = 0; i < input.length; i ++ ) {

					if ( input[ i ] instanceof Scene ) {

						processScene( input[ i ] );

					} else {

						objectsWithoutScene.push( input[ i ] );

					}

				}

				if ( objectsWithoutScene.length > 0 ) {

					processObjects( objectsWithoutScene );

				}

				for ( i = 0; i < skins.length; ++ i ) {

					processSkin( skins[ i ] );

				}

				for ( i = 0; i < options.animations.length; ++ i ) {

					processAnimation( options.animations[ i ], input[ 0 ] );

				}

			}

			processInput( input );

			Promise.all( pending ).then( function () {

				// Merge buffers.
				var blob = new Blob( buffers, { type: 'application/octet-stream' } );

				// Declare extensions.
				var extensionsUsedList = Object.keys( extensionsUsed );
				if ( extensionsUsedList.length > 0 ) outputJSON.extensionsUsed = extensionsUsedList;

				// Update bytelength of the single buffer.
				if ( outputJSON.buffers && outputJSON.buffers.length > 0 ) outputJSON.buffers[ 0 ].byteLength = blob.size;

				if ( options.binary === true ) {

					// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification

					var GLB_HEADER_BYTES = 12;
					var GLB_HEADER_MAGIC = 0x46546C67;
					var GLB_VERSION = 2;

					var GLB_CHUNK_PREFIX_BYTES = 8;
					var GLB_CHUNK_TYPE_JSON = 0x4E4F534A;
					var GLB_CHUNK_TYPE_BIN = 0x004E4942;

					var reader = new FileReader();
					reader.readAsArrayBuffer( blob );
					reader.onloadend = function () {

						// Binary chunk.
						var binaryChunk = getPaddedArrayBuffer( reader.result );
						var binaryChunkPrefix = new DataView( new ArrayBuffer( GLB_CHUNK_PREFIX_BYTES ) );
						binaryChunkPrefix.setUint32( 0, binaryChunk.byteLength, true );
						binaryChunkPrefix.setUint32( 4, GLB_CHUNK_TYPE_BIN, true );

						// JSON chunk.
						var jsonChunk = getPaddedArrayBuffer( stringToArrayBuffer( JSON.stringify( outputJSON ) ), 0x20 );
						var jsonChunkPrefix = new DataView( new ArrayBuffer( GLB_CHUNK_PREFIX_BYTES ) );
						jsonChunkPrefix.setUint32( 0, jsonChunk.byteLength, true );
						jsonChunkPrefix.setUint32( 4, GLB_CHUNK_TYPE_JSON, true );

						// GLB header.
						var header = new ArrayBuffer( GLB_HEADER_BYTES );
						var headerView = new DataView( header );
						headerView.setUint32( 0, GLB_HEADER_MAGIC, true );
						headerView.setUint32( 4, GLB_VERSION, true );
						var totalByteLength = GLB_HEADER_BYTES
							+ jsonChunkPrefix.byteLength + jsonChunk.byteLength
							+ binaryChunkPrefix.byteLength + binaryChunk.byteLength;
						headerView.setUint32( 8, totalByteLength, true );

						var glbBlob = new Blob( [
							header,
							jsonChunkPrefix,
							jsonChunk,
							binaryChunkPrefix,
							binaryChunk
						], { type: 'application/octet-stream' } );

						var glbReader = new FileReader();
						glbReader.readAsArrayBuffer( glbBlob );
						glbReader.onloadend = function () {

							onDone( glbReader.result );

						};

					};

				} else {

					if ( outputJSON.buffers && outputJSON.buffers.length > 0 ) {

						const reader = new FileReader();
						reader.readAsDataURL( blob );
						reader.onloadend = function () {

							var base64data = reader.result;
							outputJSON.buffers[ 0 ].uri = base64data;
							onDone( outputJSON );

						};

					} else {

						onDone( outputJSON );

					}

				}

			} );

		}

	};

	GLTFExporter.Utils = {

		insertKeyframe: function ( track, time ) {

			var tolerance = 0.001; // 1ms
			var valueSize = track.getValueSize();

			var times = new track.TimeBufferType( track.times.length + 1 );
			var values = new track.ValueBufferType( track.values.length + valueSize );
			var interpolant = track.createInterpolant( new track.ValueBufferType( valueSize ) );

			var index;

			if ( track.times.length === 0 ) {

				times[ 0 ] = time;

				for ( var i = 0; i < valueSize; i ++ ) {

					values[ i ] = 0;

				}

				index = 0;

			} else if ( time < track.times[ 0 ] ) {

				if ( Math.abs( track.times[ 0 ] - time ) < tolerance ) return 0;

				times[ 0 ] = time;
				times.set( track.times, 1 );

				values.set( interpolant.evaluate( time ), 0 );
				values.set( track.values, valueSize );

				index = 0;

			} else if ( time > track.times[ track.times.length - 1 ] ) {

				if ( Math.abs( track.times[ track.times.length - 1 ] - time ) < tolerance ) {

					return track.times.length - 1;

				}

				times[ times.length - 1 ] = time;
				times.set( track.times, 0 );

				values.set( track.values, 0 );
				values.set( interpolant.evaluate( time ), track.values.length );

				index = times.length - 1;

			} else {

				for ( i = 0; i < track.times.length; i ++ ) {

					if ( Math.abs( track.times[ i ] - time ) < tolerance ) return i;

					if ( track.times[ i ] < time && track.times[ i + 1 ] > time ) {

						times.set( track.times.slice( 0, i + 1 ), 0 );
						times[ i + 1 ] = time;
						times.set( track.times.slice( i + 1 ), i + 2 );

						values.set( track.values.slice( 0, ( i + 1 ) * valueSize ), 0 );
						values.set( interpolant.evaluate( time ), ( i + 1 ) * valueSize );
						values.set( track.values.slice( ( i + 1 ) * valueSize ), ( i + 2 ) * valueSize );

						index = i + 1;

						break;

					}

				}

			}

			track.times = times;
			track.values = values;

			return index;

		},

		mergeMorphTargetTracks: function ( clip, root ) {

			var tracks = [];
			var mergedTracks = {};
			var sourceTracks = clip.tracks;

			for ( var i = 0; i < sourceTracks.length; ++ i ) {

				var sourceTrack = sourceTracks[ i ];
				var sourceTrackBinding = PropertyBinding.parseTrackName( sourceTrack.name );
				var sourceTrackNode = PropertyBinding.findNode( root, sourceTrackBinding.nodeName );

				if ( sourceTrackBinding.propertyName !== 'morphTargetInfluences' || sourceTrackBinding.propertyIndex === undefined ) {

					// Tracks that don't affect morph targets, or that affect all morph targets together, can be left as-is.
					tracks.push( sourceTrack );
					continue;

				}

				if ( sourceTrack.createInterpolant !== sourceTrack.InterpolantFactoryMethodDiscrete
					&& sourceTrack.createInterpolant !== sourceTrack.InterpolantFactoryMethodLinear ) {

					if ( sourceTrack.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline ) {

						// This should never happen, because glTF morph target animations
						// affect all targets already.
						throw new Error( 'THREE.GLTFExporter: Cannot merge tracks with glTF CUBICSPLINE interpolation.' );

					}

					console.warn( 'THREE.GLTFExporter: Morph target interpolation mode not yet supported. Using LINEAR instead.' );

					sourceTrack = sourceTrack.clone();
					sourceTrack.setInterpolation( InterpolateLinear );

				}

				var targetCount = sourceTrackNode.morphTargetInfluences.length;
				var targetIndex = sourceTrackNode.morphTargetDictionary[ sourceTrackBinding.propertyIndex ];

				if ( targetIndex === undefined ) {

					throw new Error( 'THREE.GLTFExporter: Morph target name not found: ' + sourceTrackBinding.propertyIndex );

				}

				var mergedTrack;

				// If this is the first time we've seen this object, create a new
				// track to store merged keyframe data for each morph target.
				if ( mergedTracks[ sourceTrackNode.uuid ] === undefined ) {

					mergedTrack = sourceTrack.clone();

					var values = new mergedTrack.ValueBufferType( targetCount * mergedTrack.times.length );

					for ( var j = 0; j < mergedTrack.times.length; j ++ ) {

						values[ j * targetCount + targetIndex ] = mergedTrack.values[ j ];

					}

					// We need to take into consideration the intended target node
					// of our original un-merged morphTarget animation.
					mergedTrack.name = sourceTrackBinding.nodeName + '.morphTargetInfluences';
					mergedTrack.values = values;

					mergedTracks[ sourceTrackNode.uuid ] = mergedTrack;
					tracks.push( mergedTrack );

					continue;

				}

				var sourceInterpolant = sourceTrack.createInterpolant( new sourceTrack.ValueBufferType( 1 ) );

				mergedTrack = mergedTracks[ sourceTrackNode.uuid ];

				// For every existing keyframe of the merged track, write a (possibly
				// interpolated) value from the source track.
				for ( j = 0; j < mergedTrack.times.length; j ++ ) {

					mergedTrack.values[ j * targetCount + targetIndex ] = sourceInterpolant.evaluate( mergedTrack.times[ j ] );

				}

				// For every existing keyframe of the source track, write a (possibly
				// new) keyframe to the merged track. Values from the previous loop may
				// be written again, but keyframes are de-duplicated.
				for ( j = 0; j < sourceTrack.times.length; j ++ ) {

					var keyframeIndex = this.insertKeyframe( mergedTrack, sourceTrack.times[ j ] );
					mergedTrack.values[ keyframeIndex * targetCount + targetIndex ] = sourceTrack.values[ j ];

				}

			}

			clip.tracks = tracks;

			return clip;

		}

	};

	let _canvas;

	class ImageUtils {

		static getDataURL( image ) {

			if ( /^data:/i.test( image.src ) ) {

				return image.src;

			}

			if ( typeof HTMLCanvasElement == 'undefined' ) {

				return image.src;

			}

			let canvas;

			if ( image instanceof HTMLCanvasElement ) {

				canvas = image;

			} else {

				if ( _canvas === undefined ) _canvas = createElementNS( 'canvas' );

				_canvas.width = image.width;
				_canvas.height = image.height;

				const context = _canvas.getContext( '2d' );

				if ( image instanceof ImageData ) {

					context.putImageData( image, 0, 0 );

				} else {

					context.drawImage( image, 0, 0, image.width, image.height );

				}

				canvas = _canvas;

			}

			if ( canvas.width > 2048 || canvas.height > 2048 ) {

				console.warn( 'THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons', image );

				return canvas.toDataURL( 'image/jpeg', 0.6 );

			} else {

				return canvas.toDataURL( 'image/png' );

			}

		}

	}

	let textureId = 0;

	class Texture extends EventDispatcher {

		constructor( image = Texture.DEFAULT_IMAGE, mapping = Texture.DEFAULT_MAPPING, wrapS = ClampToEdgeWrapping, wrapT = ClampToEdgeWrapping, magFilter = LinearFilter, minFilter = LinearMipmapLinearFilter, format = RGBAFormat, type = UnsignedByteType, anisotropy = 1, encoding = LinearEncoding ) {

			super();

			Object.defineProperty( this, 'id', { value: textureId ++ } );

			this.uuid = generateUUID();

			this.name = '';

			this.image = image;
			this.mipmaps = [];

			this.mapping = mapping;

			this.wrapS = wrapS;
			this.wrapT = wrapT;

			this.magFilter = magFilter;
			this.minFilter = minFilter;

			this.anisotropy = anisotropy;

			this.format = format;
			this.internalFormat = null;
			this.type = type;

			this.offset = new Vector2( 0, 0 );
			this.repeat = new Vector2( 1, 1 );
			this.center = new Vector2( 0, 0 );
			this.rotation = 0;

			this.matrixAutoUpdate = true;
			this.matrix = new Matrix3();

			this.generateMipmaps = true;
			this.premultiplyAlpha = false;
			this.flipY = true;
			this.unpackAlignment = 4;	// valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)

			// Values of encoding !== THREE.LinearEncoding only supported on map, envMap and emissiveMap.
			//
			// Also changing the encoding after already used by a Material will not automatically make the Material
			// update. You need to explicitly call Material.needsUpdate to trigger it to recompile.
			this.encoding = encoding;

			this.userData = {};

			this.version = 0;
			this.onUpdate = null;

			this.isRenderTargetTexture = false;

		}

		updateMatrix() {

			this.matrix.setUvTransform( this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y );

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( source ) {

			this.name = source.name;

			this.image = source.image;
			this.mipmaps = source.mipmaps.slice( 0 );

			this.mapping = source.mapping;

			this.wrapS = source.wrapS;
			this.wrapT = source.wrapT;

			this.magFilter = source.magFilter;
			this.minFilter = source.minFilter;

			this.anisotropy = source.anisotropy;

			this.format = source.format;
			this.internalFormat = source.internalFormat;
			this.type = source.type;

			this.offset.copy( source.offset );
			this.repeat.copy( source.repeat );
			this.center.copy( source.center );
			this.rotation = source.rotation;

			this.matrixAutoUpdate = source.matrixAutoUpdate;
			this.matrix.copy( source.matrix );

			this.generateMipmaps = source.generateMipmaps;
			this.premultiplyAlpha = source.premultiplyAlpha;
			this.flipY = source.flipY;
			this.unpackAlignment = source.unpackAlignment;
			this.encoding = source.encoding;

			this.userData = JSON.parse( JSON.stringify( source.userData ) );

			return this;

		}

		toJSON( meta ) {

			const isRootObject = ( meta === undefined || typeof meta === 'string' );

			if ( ! isRootObject && meta.textures[ this.uuid ] !== undefined ) {

				return meta.textures[ this.uuid ];

			}

			const output = {

				metadata: {
					version: 4.5,
					type: 'Texture',
					generator: 'Texture.toJSON'
				},

				uuid: this.uuid,
				name: this.name,

				mapping: this.mapping,

				repeat: [ this.repeat.x, this.repeat.y ],
				offset: [ this.offset.x, this.offset.y ],
				center: [ this.center.x, this.center.y ],
				rotation: this.rotation,

				wrap: [ this.wrapS, this.wrapT ],

				format: this.format,
				type: this.type,
				encoding: this.encoding,

				minFilter: this.minFilter,
				magFilter: this.magFilter,
				anisotropy: this.anisotropy,

				flipY: this.flipY,

				premultiplyAlpha: this.premultiplyAlpha,
				unpackAlignment: this.unpackAlignment

			};

			if ( this.image !== undefined ) {

				// TODO: Move to THREE.Image

				const image = this.image;

				if ( image.uuid === undefined ) {

					image.uuid = generateUUID(); // UGH

				}

				if ( ! isRootObject && meta.images[ image.uuid ] === undefined ) {

					let url;

					if ( Array.isArray( image ) ) {

						// process array of images e.g. CubeTexture

						url = [];

						for ( let i = 0, l = image.length; i < l; i ++ ) {

							// check cube texture with data textures

							if ( image[ i ].isDataTexture ) {

								url.push( serializeImage( image[ i ].image ) );

							} else {

								url.push( serializeImage( image[ i ] ) );

							}

						}

					} else {

						// process single image

						url = serializeImage( image );

					}

					meta.images[ image.uuid ] = {
						uuid: image.uuid,
						url: url
					};

				}

				output.image = image.uuid;

			}

			if ( JSON.stringify( this.userData ) !== '{}' ) output.userData = this.userData;

			if ( ! isRootObject ) {

				meta.textures[ this.uuid ] = output;

			}

			return output;

		}

		dispose() {

			this.dispatchEvent( { type: 'dispose' } );

		}

		transformUv( uv ) {

			if ( this.mapping !== UVMapping ) return uv;

			uv.applyMatrix3( this.matrix );

			if ( uv.x < 0 || uv.x > 1 ) {

				switch ( this.wrapS ) {

					case RepeatWrapping:

						uv.x = uv.x - Math.floor( uv.x );
						break;

					case ClampToEdgeWrapping:

						uv.x = uv.x < 0 ? 0 : 1;
						break;

					case MirroredRepeatWrapping:

						if ( Math.abs( Math.floor( uv.x ) % 2 ) === 1 ) {

							uv.x = Math.ceil( uv.x ) - uv.x;

						} else {

							uv.x = uv.x - Math.floor( uv.x );

						}

						break;

				}

			}

			if ( uv.y < 0 || uv.y > 1 ) {

				switch ( this.wrapT ) {

					case RepeatWrapping:

						uv.y = uv.y - Math.floor( uv.y );
						break;

					case ClampToEdgeWrapping:

						uv.y = uv.y < 0 ? 0 : 1;
						break;

					case MirroredRepeatWrapping:

						if ( Math.abs( Math.floor( uv.y ) % 2 ) === 1 ) {

							uv.y = Math.ceil( uv.y ) - uv.y;

						} else {

							uv.y = uv.y - Math.floor( uv.y );

						}

						break;

				}

			}

			if ( this.flipY ) {

				uv.y = 1 - uv.y;

			}

			return uv;

		}

		set needsUpdate( value ) {

			if ( value === true ) this.version ++;

		}

	}

	Texture.DEFAULT_IMAGE = undefined;
	Texture.DEFAULT_MAPPING = UVMapping;

	Texture.prototype.isTexture = true;

	function serializeImage( image ) {

		if ( ( typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement ) ||
			( typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement ) ||
			( typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap ) ) {

			// default images

			return ImageUtils.getDataURL( image );

		} else {

			if ( image.data ) {

				// images of DataTexture

				return {
					data: Array.prototype.slice.call( image.data ),
					width: image.width,
					height: image.height,
					type: image.data.constructor.name
				};

			} else {

				console.warn( 'THREE.Texture: Unable to serialize Texture.' );
				return {};

			}

		}

	}

	/**
	 * parameters = {
	 *  color: <hex>,
	 *  opacity: <float>,
	 *
	 *  linewidth: <float>,
	 *  linecap: "round",
	 *  linejoin: "round"
	 * }
	 */

	class LineBasicMaterial extends Material {

		constructor( parameters ) {

			super();

			this.type = 'LineBasicMaterial';

			this.color = new Color( 0xffffff );

			this.linewidth = 1;
			this.linecap = 'round';
			this.linejoin = 'round';

			this.setValues( parameters );

		}


		copy( source ) {

			super.copy( source );

			this.color.copy( source.color );

			this.linewidth = source.linewidth;
			this.linecap = source.linecap;
			this.linejoin = source.linejoin;

			return this;

		}

	}

	LineBasicMaterial.prototype.isLineBasicMaterial = true;

	const _start$1 = /*@__PURE__*/ new Vector3();
	const _end$1 = /*@__PURE__*/ new Vector3();
	const _inverseMatrix = /*@__PURE__*/ new Matrix4();
	const _ray = /*@__PURE__*/ new Ray();
	const _sphere = /*@__PURE__*/ new Sphere();

	class Line extends Object3D {

		constructor( geometry = new BufferGeometry(), material = new LineBasicMaterial() ) {

			super();

			this.type = 'Line';

			this.geometry = geometry;
			this.material = material;

			this.updateMorphTargets();

		}

		copy( source ) {

			super.copy( source );

			this.material = source.material;
			this.geometry = source.geometry;

			return this;

		}

		computeLineDistances() {

			const geometry = this.geometry;

			if ( geometry.isBufferGeometry ) {

				// we assume non-indexed geometry

				if ( geometry.index === null ) {

					const positionAttribute = geometry.attributes.position;
					const lineDistances = [ 0 ];

					for ( let i = 1, l = positionAttribute.count; i < l; i ++ ) {

						_start$1.fromBufferAttribute( positionAttribute, i - 1 );
						_end$1.fromBufferAttribute( positionAttribute, i );

						lineDistances[ i ] = lineDistances[ i - 1 ];
						lineDistances[ i ] += _start$1.distanceTo( _end$1 );

					}

					geometry.setAttribute( 'lineDistance', new Float32BufferAttribute( lineDistances, 1 ) );

				} else {

					console.warn( 'THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.' );

				}

			} else if ( geometry.isGeometry ) {

				console.error( 'THREE.Line.computeLineDistances() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.' );

			}

			return this;

		}

		raycast( raycaster, intersects ) {

			const geometry = this.geometry;
			const matrixWorld = this.matrixWorld;
			const threshold = raycaster.params.Line.threshold;
			const drawRange = geometry.drawRange;

			// Checking boundingSphere distance to ray

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			_sphere.copy( geometry.boundingSphere );
			_sphere.applyMatrix4( matrixWorld );
			_sphere.radius += threshold;

			if ( raycaster.ray.intersectsSphere( _sphere ) === false ) return;

			//

			_inverseMatrix.copy( matrixWorld ).invert();
			_ray.copy( raycaster.ray ).applyMatrix4( _inverseMatrix );

			const localThreshold = threshold / ( ( this.scale.x + this.scale.y + this.scale.z ) / 3 );
			const localThresholdSq = localThreshold * localThreshold;

			const vStart = new Vector3();
			const vEnd = new Vector3();
			const interSegment = new Vector3();
			const interRay = new Vector3();
			const step = this.isLineSegments ? 2 : 1;

			if ( geometry.isBufferGeometry ) {

				const index = geometry.index;
				const attributes = geometry.attributes;
				const positionAttribute = attributes.position;

				if ( index !== null ) {

					const start = Math.max( 0, drawRange.start );
					const end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

					for ( let i = start, l = end - 1; i < l; i += step ) {

						const a = index.getX( i );
						const b = index.getX( i + 1 );

						vStart.fromBufferAttribute( positionAttribute, a );
						vEnd.fromBufferAttribute( positionAttribute, b );

						const distSq = _ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );

						if ( distSq > localThresholdSq ) continue;

						interRay.applyMatrix4( this.matrixWorld ); //Move back to world space for distance calculation

						const distance = raycaster.ray.origin.distanceTo( interRay );

						if ( distance < raycaster.near || distance > raycaster.far ) continue;

						intersects.push( {

							distance: distance,
							// What do we want? intersection point on the ray or on the segment??
							// point: raycaster.ray.at( distance ),
							point: interSegment.clone().applyMatrix4( this.matrixWorld ),
							index: i,
							face: null,
							faceIndex: null,
							object: this

						} );

					}

				} else {

					const start = Math.max( 0, drawRange.start );
					const end = Math.min( positionAttribute.count, ( drawRange.start + drawRange.count ) );

					for ( let i = start, l = end - 1; i < l; i += step ) {

						vStart.fromBufferAttribute( positionAttribute, i );
						vEnd.fromBufferAttribute( positionAttribute, i + 1 );

						const distSq = _ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );

						if ( distSq > localThresholdSq ) continue;

						interRay.applyMatrix4( this.matrixWorld ); //Move back to world space for distance calculation

						const distance = raycaster.ray.origin.distanceTo( interRay );

						if ( distance < raycaster.near || distance > raycaster.far ) continue;

						intersects.push( {

							distance: distance,
							// What do we want? intersection point on the ray or on the segment??
							// point: raycaster.ray.at( distance ),
							point: interSegment.clone().applyMatrix4( this.matrixWorld ),
							index: i,
							face: null,
							faceIndex: null,
							object: this

						} );

					}

				}

			} else if ( geometry.isGeometry ) {

				console.error( 'THREE.Line.raycast() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.' );

			}

		}

		updateMorphTargets() {

			const geometry = this.geometry;

			if ( geometry.isBufferGeometry ) {

				const morphAttributes = geometry.morphAttributes;
				const keys = Object.keys( morphAttributes );

				if ( keys.length > 0 ) {

					const morphAttribute = morphAttributes[ keys[ 0 ] ];

					if ( morphAttribute !== undefined ) {

						this.morphTargetInfluences = [];
						this.morphTargetDictionary = {};

						for ( let m = 0, ml = morphAttribute.length; m < ml; m ++ ) {

							const name = morphAttribute[ m ].name || String( m );

							this.morphTargetInfluences.push( 0 );
							this.morphTargetDictionary[ name ] = m;

						}

					}

				}

			} else {

				const morphTargets = geometry.morphTargets;

				if ( morphTargets !== undefined && morphTargets.length > 0 ) {

					console.error( 'THREE.Line.updateMorphTargets() does not support THREE.Geometry. Use THREE.BufferGeometry instead.' );

				}

			}

		}

	}

	Line.prototype.isLine = true;

	const _start = /*@__PURE__*/ new Vector3();
	const _end = /*@__PURE__*/ new Vector3();

	class LineSegments extends Line {

		constructor( geometry, material ) {

			super( geometry, material );

			this.type = 'LineSegments';

		}

		computeLineDistances() {

			const geometry = this.geometry;

			if ( geometry.isBufferGeometry ) {

				// we assume non-indexed geometry

				if ( geometry.index === null ) {

					const positionAttribute = geometry.attributes.position;
					const lineDistances = [];

					for ( let i = 0, l = positionAttribute.count; i < l; i += 2 ) {

						_start.fromBufferAttribute( positionAttribute, i );
						_end.fromBufferAttribute( positionAttribute, i + 1 );

						lineDistances[ i ] = ( i === 0 ) ? 0 : lineDistances[ i - 1 ];
						lineDistances[ i + 1 ] = lineDistances[ i ] + _start.distanceTo( _end );

					}

					geometry.setAttribute( 'lineDistance', new Float32BufferAttribute( lineDistances, 1 ) );

				} else {

					console.warn( 'THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.' );

				}

			} else if ( geometry.isGeometry ) {

				console.error( 'THREE.LineSegments.computeLineDistances() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.' );

			}

			return this;

		}

	}

	LineSegments.prototype.isLineSegments = true;

	onmessage = onMessage;

	const gradient = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAACCAYAAAA5Ht7JAAAAd0lEQVQY08XBzQ7BQBSA0e9Of1SElWCKxNLWK3sgG2IjKqlm0i6tLGZur8dwjpylscaVXCznlU15LEtilSOTDJmDrEHqEfEfZBNw9Z3KX5n5G4vVk0Px5YRyRNkn2PbGbhCKEKFL0Cm0Ed4JWoWgEEcAxAzHn/0AK3IoAmtWeUsAAAAASUVORK5CYII=';

	function onMessage ( event ) {

		const data = event.data;
		const options = data.options;

		const scene = new Scene();

		data.items.forEach( function ( item ) { scene.add( getItem( item, options ) ); } );

		const exporter = new GLTFExporter();

		exporter.parse(
			scene,
			function ( result ) {

				if ( options.binary ) {

					postMessage( { status: 'ok', gltf: result }, [ result ] );

				} else {

					const output = JSON.stringify( result, null, 2 );
					postMessage( { status: 'ok', gltf: output } );

				}

			},
			{ binary: options.binary }
		);

	}

	function getItem( item, options ) {

		switch ( item.type ) {

		case 'walls':
			return getWalls( item, options );

		case 'lines':
			return getLines( item, options );

		default:
			console.error( 'unknown item type', item.type, ' requested' );

		}

	}

	function getWalls( item, options ) {

		const geometry = new BufferGeometry();

		geometry.setIndex( item.index );
		geometry.setAttribute( 'position', item.position );

		const vertices = item.position.array;
		const vertexCount = vertices.length / 3;

		const uvs = new Float32BufferAttribute( vertexCount * 2, 2 );
		const uvBuffer = uvs.array;

		const zz = item.modelLimits.max.z;
		const z2 = 2 * zz;

		for ( let i = 0; i < vertexCount; i++ ) {

			const zOffset = i * 3 + 2; // ( offset of Z value )
			const offset = i * 2;

			const u = ( vertices[ zOffset ] + zz ) / z2;

			uvBuffer[ offset ] = u;
			uvBuffer[ offset + 1 ] = u;

		}

		geometry.setAttribute( 'uv', uvs );

		const material = new MeshStandardMaterial( { map: new Texture( gradient ) } );

		if ( options.rotate ) {

			rotateAxes( vertices );

		}

		return new Mesh( geometry, material );

	}

	function getLines( item, options ) {

		const geometry = new BufferGeometry();

		geometry.setIndex( item.index );
		geometry.setAttribute( 'position', item.position );

		const material = new MeshStandardMaterial();

		if ( options.rotate ) {

			rotateAxes( item.position.array );

		}

		return new LineSegments( geometry, material );

	}

	function rotateAxes( vertices ) {

		const vertexCount = vertices.length;

		// rotate axes for z up.
		for ( let i = 0; i < vertexCount; i++ ) {

			const v = i * 3;
			const z = vertices[ v + 2 ];

			vertices[ v + 2 ] = -vertices[ v + 1 ]; // z = -y
			vertices[ v + 1 ] = z; // y = z

		}

	}

}));
