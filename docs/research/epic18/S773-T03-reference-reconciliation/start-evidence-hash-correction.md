# S773 start-evidence digest correction

**Recorded:** 2026-10-13. During the S773 Control Center verification at board
revision 4607, the repository's `hashEvidenceArtifact` check reported that the
`E-G05-S773-START` row's recorded digest did not match
`start-packet.md`. The board row recorded
`be215485e6017ce350e9455414ff43e6862a25020570131ebbc3dee8545992c6`; the
current packet hashes to
`5d86f7ea9606bd4fb0e253e019e15e3760f963309c2ace81c10b98e5d996d9f2` under the
same CRLF-to-LF normalization used by the repository verifier. The packet is
already LF text, and its contents were not changed to fit either hash.

The original start evidence row and its history are preserved. This correction
adds a separate verified evidence record binding the unchanged start packet to
the verifier's actual digest. It does not revise S773 scope, implementation,
status, or admission authority. The final Control Center run also asserts this
corrected binding and checks the complete S773 exit/replay evidence.
