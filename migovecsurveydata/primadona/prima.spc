;Jamarska sekcija Planinskega društva Tolmin
;PRIMADONA- iztegnjeni profil
;PRIMADONA- Survex specfile for extended elevation
;*copyright JSPDT/ICCC
  
;vnesel Z.Rejec 23.10.2006
;changes & updates for PORTRAIT printing by Jarvist Frost, ICCC: 06.11.2006
;Idea is to have main cave drop down left margin, leaving space for Plan in bottom right
;Smer0 (northerly going climbing gallery) is sent back across entrance pitches
;This leaves space in top right for label, title & etc.
;primer ukaza: extend --specfile=prima.spc primadona.3d
;Utilisation:  extend --specfile=prima.spc primadona.3d

;ZAÈETEK UKAZOV:
*start primadona.prima1.35 ; Entrance!

*eswap primadona.drugi.4 ; place second entrance near first

*eswap primadona.galerija.16 ; Send Galerija towards centre
*eswap primadona.pov.27 ; Throw deep stuff (POV, TTT et al.) back underneath entrance pitches
*eswap primadona.ttt.26 ; Send Prima2 gallery back towards centre of screen
*eswap primadona.ttt.1 ; bottom of TTT pitch
*eswap primadona.smer0.43 ; Send smer0 back towards centre, going on top of Popotresni
*eswap primadona.smer0.25 ; and now back towards edge...
*eswap primadona.smer0.3 ; send higher passage back

; Force deep stuff to oscilate down edge
*eswap primadona.zima00.3 
*eswap primadona.zima00.12
*eswap primadona.spodnji.7
*eswap primadona.milanova.2

;Sort out mess in centre with popotresni - is this a big chamber?
*eright primadona.popotresni.pop8 primadona.popotresni.pop12
*eleft primadona.brez_volje.pop22 primadona.popotresni.pop21
*eswap primadona.brez_volje.bv9