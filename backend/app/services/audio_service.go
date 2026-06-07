package services

import (
	"encoding/binary"
	"fmt"
	"math"
)

// WAVHeader WAV文件头信息
type WAVHeader struct {
	SampleRate    int
	NumChannels   int
	BitsPerSample int
	DataSize      int
	DataOffset    int
}

// ParseWAV 解析WAV文件，提取PCM数据
func ParseWAV(data []byte) ([]int16, *WAVHeader, error) {
	if len(data) < 44 {
		return nil, nil, fmt.Errorf("WAV文件过小")
	}

	// 查找 'data' chunk
	dataOffset := 44
	dataSize := len(data) - 44

	if len(data) > 44 {
		offset := 12
		for offset+8 <= len(data) {
			chunkID := string(data[offset : offset+4])
			chunkSize := int(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
			if chunkID == "data" {
				dataOffset = offset + 8
				dataSize = chunkSize
				break
			}
			offset += 8 + chunkSize
		}
	}

	// 读取格式信息
	sampleRate := int(binary.LittleEndian.Uint32(data[24:28]))
	numChannels := int(binary.LittleEndian.Uint16(data[22:24]))
	bitsPerSample := int(binary.LittleEndian.Uint16(data[34:36]))

	header := &WAVHeader{
		SampleRate:    sampleRate,
		NumChannels:   numChannels,
		BitsPerSample: bitsPerSample,
		DataSize:      dataSize,
		DataOffset:    dataOffset,
	}

	// 提取 PCM数据
	numSamples := (dataSize) / (bitsPerSample / 8)
	pcm := make([]int16, numSamples)
	for i := 0; i < numSamples && dataOffset+i*2+1 < len(data); i++ {
		pcm[i] = int16(binary.LittleEndian.Uint16(data[dataOffset+i*2 : dataOffset+i*2+2]))
	}

	return pcm, header, nil
}

// MakeSilence 生成静音 PCM
func MakeSilence(ms, sampleRate int) []int16 {
	numSamples := int(math.Round(float64(sampleRate) * float64(ms) / 1000.0))
	return make([]int16, numSamples)
}

// ConcatPCM 拼接多个PCM数组
func ConcatPCM(chunks [][]int16) []int16 {
	total := 0
	for _, c := range chunks {
		total += len(c)
	}
	result := make([]int16, total)
	offset := 0
	for _, c := range chunks {
		copy(result[offset:], c)
		offset += len(c)
	}
	return result
}

// PCMToWAV PCM → WAV
func PCMToWAV(pcm []int16, sampleRate, numChannels, bitsPerSample int) []byte {
	dataSize := len(pcm) * bitsPerSample / 8
	buf := make([]byte, 44+dataSize)

	// RIFF header
	copy(buf[0:4], "RIFF")
	binary.LittleEndian.PutUint32(buf[4:8], uint32(36+dataSize))
	copy(buf[8:12], "WAVE")

	// fmt chunk
	copy(buf[12:16], "fmt ")
	binary.LittleEndian.PutUint32(buf[16:20], 16)                  // chunk size
	binary.LittleEndian.PutUint16(buf[20:22], 1)                   // PCM format
	binary.LittleEndian.PutUint16(buf[22:24], uint16(numChannels))
	binary.LittleEndian.PutUint32(buf[24:28], uint32(sampleRate))
	byteRate := sampleRate * numChannels * bitsPerSample / 8
	binary.LittleEndian.PutUint32(buf[28:32], uint32(byteRate))
	binary.LittleEndian.PutUint16(buf[32:34], uint16(numChannels*bitsPerSample/8))
	binary.LittleEndian.PutUint16(buf[34:36], uint16(bitsPerSample))

	// data chunk
	copy(buf[36:40], "data")
	binary.LittleEndian.PutUint32(buf[40:44], uint32(dataSize))

	// 写入采样数据
	for i, sample := range pcm {
		binary.LittleEndian.PutUint16(buf[44+i*2:], uint16(sample))
	}

	return buf
}
