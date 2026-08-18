(module
  (memory (export "memory") 1)

  ;; Two 96 x 128 luma frames followed by an expandable Float32 audio buffer.
  (global $frame_capacity i32 (i32.const 12288))
  (global $current_buffer i32 (i32.const 0))
  (global $previous_buffer i32 (i32.const 12288))
  (global $audio_buffer i32 (i32.const 24576))
  (global $last_shift_error (mut i32) (i32.const 0))

  (func $min_u32 (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.lt_u
    if (result i32)
      local.get $a
    else
      local.get $b
    end)

  (func $abs_i32 (param $value i32) (result i32)
    local.get $value
    i32.const 0
    i32.lt_s
    if (result i32)
      i32.const 0
      local.get $value
      i32.sub
    else
      local.get $value
    end)

  (func $abs_f32 (param $value f32) (result f32)
    local.get $value
    f32.abs)

  (func (export "current_buffer") (result i32)
    global.get $current_buffer)

  (func (export "previous_buffer") (result i32)
    global.get $previous_buffer)

  (func (export "audio_buffer") (result i32)
    global.get $audio_buffer)

  ;; Mean luminance in Q8.8 (0 .. 65280).
  (func (export "exposure") (param $length i32) (result i32)
    (local $index i32)
    (local $sum i64)

    local.get $length
    global.get $frame_capacity
    call $min_u32
    local.set $length
    local.get $length
    i32.eqz
    if
      i32.const 0
      return
    end

    block $done
      loop $scan
        local.get $index
        local.get $length
        i32.ge_u
        br_if $done

        local.get $sum
        local.get $index
        i32.load8_u
        i64.extend_i32_u
        i64.add
        local.set $sum

        local.get $index
        i32.const 1
        i32.add
        local.set $index
        br $scan
      end
    end

    local.get $sum
    i64.const 256
    i64.mul
    local.get $length
    i32.const 2
    i32.div_u
    i64.extend_i32_u
    i64.add
    local.get $length
    i64.extend_i32_u
    i64.div_u
    i32.wrap_i64)

  ;; Mean absolute four-neighbour Laplacian in Q8.8.
  (func (export "sharpness") (param $width i32) (param $height i32) (result i32)
    (local $x i32)
    (local $y i32)
    (local $index i32)
    (local $laplacian i32)
    (local $samples i32)
    (local $detail i64)

    local.get $width
    i32.const 3
    i32.lt_u
    if i32.const 0 return end
    local.get $height
    i32.const 3
    i32.lt_u
    if i32.const 0 return end
    local.get $width
    local.get $height
    i32.mul
    global.get $frame_capacity
    i32.gt_u
    if i32.const 0 return end

    i32.const 1
    local.set $y
    block $rows_done
      loop $rows
        local.get $y
        i32.const 1
        i32.add
        local.get $height
        i32.ge_u
        br_if $rows_done

        i32.const 1
        local.set $x
        block $columns_done
          loop $columns
            local.get $x
            i32.const 1
            i32.add
            local.get $width
            i32.ge_u
            br_if $columns_done

            local.get $y
            local.get $width
            i32.mul
            local.get $x
            i32.add
            local.set $index

            local.get $index
            i32.load8_u
            i32.const 4
            i32.mul
            local.get $index
            i32.const 1
            i32.sub
            i32.load8_u
            i32.sub
            local.get $index
            i32.const 1
            i32.add
            i32.load8_u
            i32.sub
            local.get $index
            local.get $width
            i32.sub
            i32.load8_u
            i32.sub
            local.get $index
            local.get $width
            i32.add
            i32.load8_u
            i32.sub
            local.set $laplacian

            local.get $detail
            local.get $laplacian
            call $abs_i32
            i64.extend_i32_u
            i64.add
            local.set $detail
            local.get $samples
            i32.const 1
            i32.add
            local.set $samples

            local.get $x
            i32.const 1
            i32.add
            local.set $x
            br $columns
          end
        end

        local.get $y
        i32.const 1
        i32.add
        local.set $y
        br $rows
      end
    end

    local.get $samples
    i32.eqz
    if i32.const 0 return end
    local.get $detail
    i64.const 256
    i64.mul
    local.get $samples
    i32.const 2
    i32.div_u
    i64.extend_i32_u
    i64.add
    local.get $samples
    i64.extend_i32_u
    i64.div_u
    i32.wrap_i64)

  ;; Finds the best translation. dx is packed high and dy low as signed int16.
  (func (export "best_shift")
    (param $width i32) (param $height i32) (param $radius i32) (result i32)
    (local $maximum_radius i32)
    (local $dx i32)
    (local $dy i32)
    (local $x i32)
    (local $y i32)
    (local $previous_index i32)
    (local $current_index i32)
    (local $difference i32)
    (local $count i32)
    (local $sum i64)
    (local $best_count i32)
    (local $best_sum i64)
    (local $best_dx i32)
    (local $best_dy i32)
    (local $has_best i32)

    i32.const 0
    global.set $last_shift_error
    local.get $width
    i32.const 3
    i32.lt_u
    if i32.const 0 return end
    local.get $height
    i32.const 3
    i32.lt_u
    if i32.const 0 return end
    local.get $width
    local.get $height
    i32.mul
    global.get $frame_capacity
    i32.gt_u
    if i32.const 0 return end

    local.get $width
    i32.const 1
    i32.sub
    i32.const 2
    i32.div_u
    local.get $height
    i32.const 1
    i32.sub
    i32.const 2
    i32.div_u
    call $min_u32
    i32.const 8
    call $min_u32
    local.set $maximum_radius
    local.get $radius
    local.get $maximum_radius
    call $min_u32
    local.set $radius

    i32.const 0
    local.get $radius
    i32.sub
    local.set $dy
    block $dy_done
      loop $dy_loop
        local.get $dy
        local.get $radius
        i32.gt_s
        br_if $dy_done

        i32.const 0
        local.get $radius
        i32.sub
        local.set $dx
        block $dx_done
          loop $dx_loop
            local.get $dx
            local.get $radius
            i32.gt_s
            br_if $dx_done

            i64.const 0
            local.set $sum
            i32.const 0
            local.set $count
            local.get $radius
            local.set $y
            block $rows_done
              loop $rows
                local.get $y
                local.get $radius
                i32.add
                local.get $height
                i32.ge_u
                br_if $rows_done

                local.get $radius
                local.set $x
                block $columns_done
                  loop $columns
                    local.get $x
                    local.get $radius
                    i32.add
                    local.get $width
                    i32.ge_u
                    br_if $columns_done

                    local.get $y
                    local.get $width
                    i32.mul
                    local.get $x
                    i32.add
                    local.set $previous_index
                    local.get $y
                    local.get $dy
                    i32.add
                    local.get $width
                    i32.mul
                    local.get $x
                    local.get $dx
                    i32.add
                    i32.add
                    local.set $current_index

                    global.get $previous_buffer
                    local.get $previous_index
                    i32.add
                    i32.load8_u
                    local.get $current_index
                    i32.load8_u
                    i32.sub
                    local.set $difference
                    local.get $sum
                    local.get $difference
                    local.get $difference
                    i32.mul
                    i64.extend_i32_u
                    i64.add
                    local.set $sum
                    local.get $count
                    i32.const 1
                    i32.add
                    local.set $count

                    local.get $x
                    i32.const 2
                    i32.add
                    local.set $x
                    br $columns
                  end
                end

                local.get $y
                i32.const 2
                i32.add
                local.set $y
                br $rows
              end
            end

            local.get $count
            i32.eqz
            if
            else
              local.get $has_best
              i32.eqz
              local.get $sum
              local.get $best_count
              i64.extend_i32_u
              i64.mul
              local.get $best_sum
              local.get $count
              i64.extend_i32_u
              i64.mul
              i64.lt_u
              i32.or
              if
                i32.const 1
                local.set $has_best
                local.get $sum
                local.set $best_sum
                local.get $count
                local.set $best_count
                local.get $dx
                local.set $best_dx
                local.get $dy
                local.set $best_dy
              end
            end

            local.get $dx
            i32.const 1
            i32.add
            local.set $dx
            br $dx_loop
          end
        end

        local.get $dy
        i32.const 1
        i32.add
        local.set $dy
        br $dy_loop
      end
    end

    local.get $has_best
    if
      local.get $best_sum
      f64.convert_i64_u
      local.get $best_count
      f64.convert_i32_u
      f64.div
      f64.sqrt
      f64.const 255
      f64.div
      f64.const 65536
      f64.mul
      f64.const 0.5
      f64.add
      i32.trunc_f64_u
      global.set $last_shift_error
    end

    local.get $best_dx
    i32.const 65535
    i32.and
    i32.const 16
    i32.shl
    local.get $best_dy
    i32.const 65535
    i32.and
    i32.or)

  (func (export "shift_error") (result i32)
    global.get $last_shift_error)

  (func (export "commit_frame") (param $length i32) (result i32)
    (local $index i32)
    local.get $length
    global.get $frame_capacity
    call $min_u32
    local.set $length
    block $done
      loop $copy
        local.get $index
        local.get $length
        i32.ge_u
        br_if $done
        global.get $previous_buffer
        local.get $index
        i32.add
        local.get $index
        i32.load8_u
        i32.store8
        local.get $index
        i32.const 1
        i32.add
        local.set $index
        br $copy
      end
    end
    local.get $length)

  (func $soft_limit (param $value f32) (param $target f32) (result f32)
    (local $magnitude f32)
    (local $headroom f32)
    (local $excess f32)
    (local $limited f32)
    local.get $value
    call $abs_f32
    local.tee $magnitude
    local.get $target
    f32.le
    if
      local.get $value
      return
    end
    f32.const 1
    local.get $target
    f32.sub
    local.set $headroom
    local.get $magnitude
    local.get $target
    f32.sub
    local.set $excess
    local.get $target
    local.get $headroom
    f32.const 0
    f32.gt
    if (result f32)
      local.get $excess
      f32.const 1
      local.get $excess
      local.get $headroom
      f32.div
      f32.add
      f32.div
    else
      f32.const 0
    end
    f32.add
    local.set $limited
    local.get $value
    f32.const 0
    f32.lt
    if (result f32)
      f32.const 0
      local.get $limited
      f32.sub
    else
      local.get $limited
    end)

  ;; Peak normalization and limiting across the entire JS-grown audio region.
  (func (export "master_audio")
    (param $count i32) (param $target f32) (result f32)
    (local $index i32)
    (local $address i32)
    (local $sample f32)
    (local $magnitude f32)
    (local $peak f32)
    (local $gain f32)

    local.get $count
    i32.eqz
    if
      f32.const 1
      return
    end
    local.get $target
    local.get $target
    f32.ne
    if
      f32.const 0.92
      local.set $target
    end
    local.get $target
    f32.const 0
    f32.lt
    if
      f32.const 0
      local.set $target
    end
    local.get $target
    f32.const 0.999
    f32.gt
    if
      f32.const 0.999
      local.set $target
    end

    block $peak_done
      loop $peak_scan
        local.get $index
        local.get $count
        i32.ge_u
        br_if $peak_done
        global.get $audio_buffer
        local.get $index
        i32.const 4
        i32.mul
        i32.add
        local.tee $address
        f32.load
        local.tee $sample
        local.get $sample
        f32.ne
        if
          local.get $address
          f32.const 0
          f32.store
          f32.const 0
          local.set $sample
        end
        local.get $sample
        call $abs_f32
        local.tee $magnitude
        local.get $peak
        f32.gt
        if
          local.get $magnitude
          local.set $peak
        end
        local.get $index
        i32.const 1
        i32.add
        local.set $index
        br $peak_scan
      end
    end

    local.get $target
    f32.const 0
    f32.eq
    if
      i32.const 0
      local.set $index
      block $zero_done
        loop $zero
          local.get $index
          local.get $count
          i32.ge_u
          br_if $zero_done
          global.get $audio_buffer
          local.get $index
          i32.const 4
          i32.mul
          i32.add
          f32.const 0
          f32.store
          local.get $index
          i32.const 1
          i32.add
          local.set $index
          br $zero
        end
      end
      f32.const 0
      return
    end

    local.get $peak
    f32.const 0.000001
    f32.lt
    if
      f32.const 1
      return
    end
    local.get $target
    local.get $peak
    f32.div
    local.set $gain
    local.get $gain
    f32.const 16
    f32.gt
    if
      f32.const 16
      local.set $gain
    end

    i32.const 0
    local.set $index
    block $process_done
      loop $process
        local.get $index
        local.get $count
        i32.ge_u
        br_if $process_done
        global.get $audio_buffer
        local.get $index
        i32.const 4
        i32.mul
        i32.add
        local.tee $address
        local.get $address
        f32.load
        local.get $gain
        f32.mul
        local.get $target
        call $soft_limit
        f32.store
        local.get $index
        i32.const 1
        i32.add
        local.set $index
        br $process
      end
    end
    local.get $gain)
)
