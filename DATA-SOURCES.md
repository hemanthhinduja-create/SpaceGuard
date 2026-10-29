# Mission references

## Data flow

`src/data/satellites.json` (the curated catalogue below) is the **seed source**. `npm run seed` upserts the 32 profiles into MongoDB by their stable `id`; the app then serves them through `GET /api/satellites`. Telemetry is **simulated** by the backend and stored in MongoDB — it is not obtained from any satellite, agency or third-party API.

## Mission references

These links document mission identity and purpose. They are reference pages, not telemetry endpoints. Active labels describe the local demonstration, and reference locations are not live positions. Source review date: 11 September 2026.

| Mission | Agency reference |
| --- | --- |
| Aditya-L1 | [ISRO](https://www.isro.gov.in/Aditya_L1.html) |
| Parker Solar Probe | [NASA](https://science.nasa.gov/mission/parker-solar-probe/) |
| Solar Orbiter | [ESA / NASA](https://science.nasa.gov/mission/solar-orbiter/) |
| SOHO | [ESA / NASA](https://science.nasa.gov/mission/soho/) |
| Solar Dynamics Observatory | [NASA](https://science.nasa.gov/mission/sdo/) |
| Hinode | [JAXA / NASA](https://science.nasa.gov/mission/hinode/) |
| James Webb Space Telescope | [NASA / ESA / CSA](https://science.nasa.gov/mission/webb/) |
| Hubble Space Telescope | [NASA / ESA](https://science.nasa.gov/mission/hubble/) |
| Chandra X-ray Observatory | [NASA](https://science.nasa.gov/mission/chandra/) |
| XMM-Newton | [ESA](https://www.esa.int/Science_Exploration/Space_Science/XMM-Newton) |
| TESS | [NASA](https://science.nasa.gov/mission/tess/) |
| Euclid | [ESA](https://www.esa.int/Science_Exploration/Space_Science/Euclid) |
| Chandrayaan-3 | [ISRO](https://www.isro.gov.in/Chandrayaan3_Details.html) |
| Chandrayaan-2 Orbiter | [ISRO](https://www.isro.gov.in/Chandrayaan2.html) |
| Lunar Reconnaissance Orbiter | [NASA](https://science.nasa.gov/mission/lro/) |
| Mars Reconnaissance Orbiter | [NASA](https://science.nasa.gov/mission/mars-reconnaissance-orbiter/) |
| Mars Express | [ESA](https://www.esa.int/Science_Exploration/Space_Science/Mars_Express) |
| MAVEN | [NASA](https://science.nasa.gov/mission/maven/) |
| Juno | [NASA](https://science.nasa.gov/mission/juno/) |
| BepiColombo | [ESA / JAXA](https://www.esa.int/Science_Exploration/Space_Science/BepiColombo) |
| JUICE | [ESA](https://www.esa.int/Science_Exploration/Space_Science/Juice) |
| Cassini | [NASA / ESA / ASI](https://science.nasa.gov/mission/cassini/) |
| Terra | [NASA](https://science.nasa.gov/mission/terra/) |
| Aqua | [NASA](https://science.nasa.gov/mission/aqua/) |
| Landsat 9 | [NASA / USGS](https://science.nasa.gov/mission/landsat-9/) |
| Sentinel-2A | [ESA / European Commission](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2) |
| Sentinel-3A | [ESA / EUMETSAT](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-3) |
| INSAT-3D | [ISRO](https://www.isro.gov.in/INSAT_3D.html) |
| GSAT-30 | [ISRO](https://www.isro.gov.in/GSAT_30.html) |
| AstroSat | [ISRO](https://www.isro.gov.in/AstroSat.html) |
| International Space Station | [NASA / Roscosmos / ESA / JAXA / CSA](https://www.nasa.gov/international-space-station/) |
| DSCOVR | [NOAA / NASA / USAF](https://science.nasa.gov/mission/dscovr/) |

MAVEN is marked as an archive because [NASA reports its mission has ended](https://science.nasa.gov/mission/maven/). Chandrayaan-3 refers specifically to the surface campaign; its propulsion module is not represented as an active lander or rover.

Launch years refer to initial spacecraft launch; the ISS year refers to its first module. The three local SVG assets illustrate categories only. Descriptions are short original summaries, not copied agency articles.
