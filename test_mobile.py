import asyncio
from playwright.async_api import async_playwright

BASE='file:///Users/riquer/danza_digital/registro_OFFLINE.html'

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        # iPhone-ish viewport
        ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, device_scale_factor=3)
        pg=await ctx.new_page()
        msgs=[]
        pg.on('console', lambda m: msgs.append(m.text) if 'error' in m.type else None)
        await pg.goto(BASE)
        await pg.wait_for_timeout(800)
        # medir desbordamiento
        res=await pg.evaluate("""()=>{
          const de=document.documentElement;
          return {innerW:window.innerWidth, scrollW:de.scrollWidth, overflow: de.scrollWidth > window.innerWidth+1};
        }""")
        print('MOBILE 390px:', res)
        # llenar paso 1 y avanzar para ver paso 2 en movil
        await pg.fill('#al_nombre','Liahnys'); await pg.fill('#al_ap','Cortés'); await pg.fill('#al_am','Peña')
        await pg.fill('#al_fnac','2016-08-10'); await pg.check('input[name=sexo][value=Femenino]')
        await pg.fill('#al_edad','10'); await pg.select_option('#al_ciclo', value='Enero - Junio'); await pg.fill('#al_ciclo_anio','2026')
        await pg.check('#al_modalidades input[value=Ballet]')
        await pg.click('#btnNext'); await pg.wait_for_timeout(400)
        # medir paso 2
        res2=await pg.evaluate("""()=>({innerW:window.innerWidth, scrollW:document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > window.innerWidth+1})""")
        print('PASO2 MOBILE:', res2)
        await pg.screenshot(path='/Users/riquer/danza_digital/test_out/rev3/mobile_step2.png', full_page=False)
        # errores de consola
        errs=[m for m in msgs if m]
        print('CONSOLE ERRORS:', errs[:10] if errs else 'ninguno')
        await b.close()

asyncio.run(main())
