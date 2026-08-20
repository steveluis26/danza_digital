import asyncio, os
from playwright.async_api import async_playwright

BASE='file:///Users/riquer/danza_digital/registro_OFFLINE.html'
OUT='/Users/riquer/danza_digital/test_out/revision/prueba.pdf'

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':800,'height':1000}, locale='es-MX', accept_downloads=True)
        pg=await ctx.new_page()
        got=[]
        pg.on('download', lambda d: got.append(d))
        await pg.goto(BASE)
        await pg.wait_for_timeout(500)
        # paso 1 alumno
        await pg.fill('#al_nombre','Liahnys Yarem'); await pg.fill('#al_ap','Cortés'); await pg.fill('#al_am','Peña')
        await pg.fill('#al_fnac','2016-08-10'); await pg.check('input[name=sexo][value=Femenino]')
        await pg.fill('#al_edad','10'); await pg.select_option('#al_ciclo', value='Enero - Junio'); await pg.fill('#al_ciclo_anio','2026')
        await pg.fill('#al_entidad','Veracruz'); await pg.check('#al_modalidades input[value=Ballet]')
        await pg.fill('#al_mod_otra','Contemporáneo')
        await pg.click('#btnNext'); await pg.wait_for_timeout(200)
        # paso 2 tutor/pagos (los campos de salud quedan en "—", suficiente para probar layout)
        await pg.fill('#t_nombre','Maria Montejo'); await pg.select_option('#t_id_tipo', value='INE'); await pg.fill('#t_id_folio','F1')
        await pg.select_option('#t_parent', value='Madre'); await pg.fill('#t_calle','Salamanca 6'); await pg.fill('#t_col','Nva Tacoteno')
        await pg.fill('#t_cp','96735'); await pg.fill('#t_ciudad','Minatitlán')
        await pg.fill('#p_insc','400'); await pg.fill('#p_mens','700'); await pg.fill('#p_otros','0')
        await pg.check('input[name=pago][value=Transferencia]')
        await pg.check('input[name=foto][value=SI]'); await pg.check('input[name=publi][value=NO]')
        await pg.fill('#fecha_firma','2026-08-13')
        await pg.click('#btnNext'); await pg.wait_for_timeout(600)
        await pg.evaluate('generatePDF()')
        await pg.wait_for_timeout(4000)
        for d in got:
            if d.suggested_filename.endswith('.pdf'):
                await d.save_as(OUT)
                print('PDF guardado', os.path.getsize(OUT), 'bytes')
        await b.close()

asyncio.run(main())
