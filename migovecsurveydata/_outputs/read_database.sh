sqlite3  <<END_SQL
.open west_plateau.sql
 SELECT c.LENGTH,s.NAME 
 FROM CENTRELINE AS c,TOPO as t,SURVEY AS s,PERSON AS p 
 WHERE p.SURNAME="Racine" 
 AND t.CENTRELINE_ID = c.ID 
 AND s.ID = c.SURVEY_ID 
 AND p.ID = t.PERSON_ID;

 .quit